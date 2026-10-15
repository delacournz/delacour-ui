import { type ReactElement, useEffect } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapPart, useMapUserLocation } from "./map.context";
import { MAP_ROUTE_TOKEN, mapVariants, resolveHeadingRotation } from "./map.variants";
import { lngLatToLatLng } from "./map-geometry";

export type MapUserLocationProps = {
	/** Draws a cone over the dot in the direction the device faces, when it knows. */
	showsHeading?: boolean;
};

/** The heading cone's box, in points — wider than the platform's dot, so it shows round it. */
const CONE = { width: 44, height: 44 } as const;

/**
 * The device's own position, as the platform's location dot.
 *
 * Mounting it turns the native location layer on, which asks for foreground
 * location permission the first time; the app's config has to declare why.
 * The position arrives through the map rather than a location library, so the
 * map adds no dependency for it.
 *
 * `showsHeading` adds a cone in the theme's primary, turned to the device's
 * heading. Neither platform's dot takes the theme, and only one shows a
 * heading, so the cone is drawn here; while the heading is unknown it is not
 * drawn at all rather than pointing north by default.
 */
export function MapUserLocation({ showsHeading = false }: MapUserLocationProps): ReactElement | null {
	const { requestUserLocation } = useMapPart("Map.UserLocation");
	const { location, heading } = useMapUserLocation();
	const color = useThemeColor(MAP_ROUTE_TOKEN);

	useEffect(() => requestUserLocation(), [requestUserLocation]);

	const rotation = resolveHeadingRotation(heading);
	if (!showsHeading || location === null || rotation === undefined) return null;

	const { width, height } = CONE;
	const cx = width / 2;
	const cy = height / 2;

	return (
		<Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={lngLatToLatLng(location)} tappable={false} tracksViewChanges>
			<View
				accessibilityElementsHidden
				className={mapVariants().userHeading()}
				importantForAccessibility="no-hide-descendants"
				style={{ height, transform: [{ rotate: `${rotation}deg` }], width }}
			>
				<Svg height={height} width={width}>
					<Path d={`M${cx} ${cy} L${cx - 9} 2 Q${cx} -1 ${cx + 9} 2 Z`} fill={color} opacity={0.35} />
				</Svg>
			</View>
		</Marker>
	);
}
MapUserLocation.displayName = "DelacourUI.Map.UserLocation";
