import { LinearGradient } from "expo-linear-gradient";
import { memo, type ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import type { ScrollSource } from "../../hooks/use-scroll-source";
import { resolveFadeBand, resolveFadeGradient } from "../../lib/scroll-edges";
import { type ScrollEdge, scrollEdgeOpacity } from "../../lib/scroll-maths";
import { scrollFadeVariants } from "./scroll-fade.variants";

export type ScrollFadeEdgeProps = {
	source: ScrollSource;
	edge: ScrollEdge;
	/** Depth along the scroll axis, in points. */
	size: number;
	/** Points held in from the edge. */
	inset: number;
	fadeInDistance: number;
	/** The solid colour at the edge. */
	color: string;
	/** The same colour at zero alpha, for the far stop — never the `transparent` keyword. */
	faded: string;
};

/**
 * One edge's band: a static gradient whose opacity follows the scroll.
 *
 * Memoised, and its only moving part is a `useAnimatedStyle` reading the
 * source's shared values on the UI thread, so a scroll renders nothing in
 * React — neither this nor the `ScrollFade` around it.
 *
 * Hidden from assistive technology entirely: it is a picture of content
 * running on, not content.
 */
export const ScrollFadeEdge = memo(function ScrollFadeEdge({
	source,
	edge,
	size,
	inset,
	fadeInDistance,
	color,
	faded,
}: ScrollFadeEdgeProps): ReactElement {
	const { offset, contentSize, layoutSize, orientation } = source;

	const opacityStyle = useAnimatedStyle(
		() => ({
			opacity: scrollEdgeOpacity({
				edge,
				offset: offset.value,
				contentSize: contentSize.value,
				layoutSize: layoutSize.value,
				fadeInDistance,
			}),
		}),
		[edge, fadeInDistance]
	);

	const band = resolveFadeBand({ orientation, edge, size, inset });
	const { start, end } = resolveFadeGradient({ orientation, edge });

	return (
		<Animated.View
			accessible={false}
			className={scrollFadeVariants({ orientation }).band()}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={[band, opacityStyle]}
		>
			<LinearGradient colors={[color, faded]} end={end} start={start} style={StyleSheet.absoluteFill} />
		</Animated.View>
	);
});
ScrollFadeEdge.displayName = "DelacourUI.ScrollFade.Edge";
