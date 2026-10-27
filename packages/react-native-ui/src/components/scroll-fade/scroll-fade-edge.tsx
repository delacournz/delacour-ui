import { LinearGradient } from "expo-linear-gradient";
import { memo, type ReactElement } from "react";
import { StyleSheet } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScrollSource } from "../../hooks/use-scroll-source";
import { resolveFadeBand, resolveFadeGradient, resolveKeyboardLift } from "../../lib/scroll-edges";
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
	/** Points the band rises by, and the frame's end it treats as covered. See `resolveKeyboardLift`. */
	lift?: SharedValue<number>;
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
	lift,
}: ScrollFadeEdgeProps): ReactElement {
	const { offset, contentSize, layoutSize, orientation } = source;

	// One value spent twice, so the band's position and its opacity cannot disagree.
	const opacityStyle = useAnimatedStyle(() => {
		const covered = lift === undefined ? 0 : lift.value;
		return {
			opacity: scrollEdgeOpacity({
				edge,
				offset: offset.value,
				contentSize: contentSize.value,
				layoutSize: layoutSize.value,
				fadeInDistance,
				coveredEnd: covered,
			}),
			transform: [{ translateY: -covered }],
		};
	});

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

/**
 * An edge band that rises above an open keyboard.
 *
 * A separate component so the keyboard is read only where it is wanted. A plain
 * edge never touches keyboard-controller, so a fade outside a
 * `KeyboardProvider` — a card row, a sheet — keeps working without its warning.
 */
export const ScrollFadeKeyboardEdge = memo(function ScrollFadeKeyboardEdge(
	props: Omit<ScrollFadeEdgeProps, "lift">
): ReactElement {
	const { edge, source } = props;
	const { orientation } = source;
	const keyboard = useReanimatedKeyboardAnimation();
	const { bottom: safeAreaBottom } = useSafeAreaInsets();
	const lift = useDerivedValue(() =>
		resolveKeyboardLift({ orientation, edge, keyboardHeight: keyboard.height.value, safeAreaBottom })
	);

	return <ScrollFadeEdge {...props} lift={lift} />;
});
ScrollFadeKeyboardEdge.displayName = "DelacourUI.ScrollFade.KeyboardEdge";
