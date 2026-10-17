import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue, useAnimatedProps } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { buildMaskPath, TOUR_SCRIM_TOKEN, type TourSize } from "./tour.variants";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The hole, one shared value per edge, so each travels on its own timing and nothing re-renders. */
export type TourHoleValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	width: SharedValue<number>;
	height: SharedValue<number>;
	radius: SharedValue<number>;
};

/**
 * The dimmed window with the hole cut out.
 *
 * One `Path` — the window, then the hole — filled `evenodd`, so the hole is subtracted rather
 * than painted over. Its `d` is rebuilt on the UI thread from the hole's shared values every
 * frame of a transition, so the hole glides between targets with no React render. It takes no
 * touches; the scrim beneath it decides what a tap does.
 */
export function TourMask({ size, hole }: { size: TourSize; hole: TourHoleValues }): ReactElement {
	const fill = useThemeColor(TOUR_SCRIM_TOKEN);
	const { width, height } = size;

	const animatedProps = useAnimatedProps(() => ({
		d: buildMaskPath(
			{ width, height },
			{
				x: hole.x.value,
				y: hole.y.value,
				width: hole.width.value,
				height: hole.height.value,
				radius: hole.radius.value,
			}
		),
	}));

	return (
		<Svg height={height} pointerEvents="none" style={StyleSheet.absoluteFill} width={width}>
			<AnimatedPath animatedProps={animatedProps} fill={fill} fillRule="evenodd" />
		</Svg>
	);
}
TourMask.displayName = "DelacourUI.Tour.Mask";
