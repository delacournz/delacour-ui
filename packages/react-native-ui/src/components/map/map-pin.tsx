import { type ReactElement, useEffect } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapMarkerContext } from "./map.context";
import { MAP_PIN_DIMENSIONS, MAP_PIN_TONE_TOKENS, type MapPinSize, type MapPinTone, mapPinPath } from "./map.variants";

export type MapPinProps = Omit<ViewProps, "children"> & {
	/** `primary` by default; `default` is the theme's foreground; `destructive` for a problem. */
	tone?: MapPinTone;
	size?: MapPinSize;
	className?: string;
};

/**
 * A teardrop pin in a theme colour, a dot of the colour's own foreground
 * punched in its head.
 *
 * Inside a `Map.Marker` it reports where it sits, and the marker anchors on its
 * tip. It is drawn rather than an icon because a pin's tip is a point on the
 * map: a glyph centred in a square would put the place a few points off.
 * Hidden from assistive technology — the marker carries the name.
 */
export function MapPin({ tone = "primary", size = "md", className, onLayout, ...props }: MapPinProps): ReactElement {
	const marker = useMapMarkerContext();
	const { fill, dot } = MAP_PIN_TONE_TOKENS[tone];
	const fillColor = useThemeColor(fill);
	const dotColor = useThemeColor(dot);
	const { width, height } = MAP_PIN_DIMENSIONS[size];
	const reportPin = marker?.reportPin;

	useEffect(() => (reportPin === undefined ? undefined : () => reportPin(null)), [reportPin]);

	const onPinLayout = (event: LayoutChangeEvent) => {
		reportPin?.(event.nativeEvent.layout);
		onLayout?.(event);
	};

	return (
		<View
			accessibilityElementsHidden
			className={className}
			importantForAccessibility="no-hide-descendants"
			onLayout={onPinLayout}
			style={{ height, width }}
			{...props}
		>
			<Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
				<Path d={mapPinPath(width, height)} fill={fillColor} />
				<Circle cx={width / 2} cy={width / 2} fill={dotColor} r={width / 6} />
			</Svg>
		</View>
	);
}
MapPin.displayName = "DelacourUI.Map.Pin";
