import { GeoJSONSource, Layer, Marker } from "@maplibre/maplibre-react-native";
import { type ReactElement, useEffect, useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapPart, useMapUserLocation } from "./map.context";
import { MAP_ROUTE_TOKEN, mapVariants, toStyleColor } from "./map.variants";

export type MapUserLocationProps = {
	/** Draws a cone over the dot in the direction the device faces, when it knows. */
	showsHeading?: boolean;
};

/** The heading cone's box, in points — wider than the dot, so it shows round it. */
const CONE = { width: 44, height: 44 } as const;

/** The dot's radius and the ring of page colour round it, in points. */
const DOT_RADIUS = 6;
const RING_WIDTH = 3;

const SOURCE_ID = "delacour-user-location";

/**
 * The device's own position, as a dot in the theme's primary ringed in the
 * page colour.
 *
 * Mounting it turns the map's location updates on, which asks for foreground
 * location permission the first time; the app's config has to declare why.
 * The position arrives through the map rather than a location library, so the
 * map adds no dependency for it.
 *
 * The dot is drawn by the map — two circle layers — so it takes the theme
 * where the platform's own puck would not. `showsHeading` adds a cone in the
 * same primary, turned to the device's heading; while the heading is unknown
 * it is not drawn at all rather than pointing north by default.
 */
export function MapUserLocation({ showsHeading = false }: MapUserLocationProps): ReactElement | null {
	const { requestUserLocation } = useMapPart("Map.UserLocation");
	const { location, heading } = useMapUserLocation();
	const primary = useThemeColor(MAP_ROUTE_TOKEN);
	const background = useThemeColor("background");
	const dotColor = toStyleColor(primary);
	const ringColor = toStyleColor(background);

	useEffect(() => requestUserLocation(), [requestUserLocation]);

	const longitude = location?.[0];
	const latitude = location?.[1];
	const data = useMemo<GeoJSON.Point | null>(
		() =>
			longitude === undefined || latitude === undefined ? null : { coordinates: [longitude, latitude], type: "Point" },
		[longitude, latitude]
	);

	if (data === null || longitude === undefined || latitude === undefined) return null;

	const { width, height } = CONE;
	const cx = width / 2;
	const cy = height / 2;

	return (
		<>
			<GeoJSONSource data={data} id={SOURCE_ID}>
				<Layer
					id={`${SOURCE_ID}-ring`}
					paint={{
						...(ringColor === undefined ? {} : { "circle-color": ringColor }),
						"circle-pitch-alignment": "map",
						"circle-radius": DOT_RADIUS + RING_WIDTH,
					}}
					type="circle"
				/>
				<Layer
					id={`${SOURCE_ID}-dot`}
					paint={{
						...(dotColor === undefined ? {} : { "circle-color": dotColor }),
						"circle-pitch-alignment": "map",
						"circle-radius": DOT_RADIUS,
					}}
					type="circle"
				/>
			</GeoJSONSource>
			{!showsHeading || heading === undefined ? null : (
				<Marker anchor="center" lngLat={[longitude, latitude]} pointerEvents="none">
					<View
						accessibilityElementsHidden
						className={mapVariants().userHeading()}
						importantForAccessibility="no-hide-descendants"
						style={{ height, transform: [{ rotate: `${heading}deg` }], width }}
					>
						<Svg height={height} width={width}>
							<Path d={`M${cx} ${cy} L${cx - 9} 2 Q${cx} -1 ${cx + 9} 2 Z`} fill={primary} opacity={0.35} />
						</Svg>
					</View>
				</Marker>
			)}
		</>
	);
}
MapUserLocation.displayName = "DelacourUI.Map.UserLocation";
