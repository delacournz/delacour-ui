import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, {
	FadeIn,
	FadeInUp,
	FadeOut,
	FadeOutDown,
	ReduceMotion,
	useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelectionModePart } from "./selection-mode.context";
import {
	resolveBarVisible,
	SELECTION_MODE_MOTION,
	type SelectionBarPlacement,
	selectionModeVariants,
} from "./selection-mode.variants";

export type SelectionModeBarProps = ViewProps & {
	/** `edge` spans the bottom of the page; `floating` is an inset card above it. Default `edge`. */
	placement?: SelectionBarPlacement;
	/** Keep the bar up while nothing is picked. Default `false`. */
	isShownWhenEmpty?: boolean;
	/** Clear the home indicator with the bottom safe-area inset. Default `true`. */
	isSafeAreaAware?: boolean;
	className?: string;
};

const ENTERING = FadeInUp.duration(SELECTION_MODE_MOTION.fadeMs);
const EXITING = FadeOutDown.duration(SELECTION_MODE_MOTION.reducedFadeMs);
const REDUCED_ENTERING = FadeIn.duration(SELECTION_MODE_MOTION.reducedFadeMs).reduceMotion(ReduceMotion.Never);
const REDUCED_EXITING = FadeOut.duration(SELECTION_MODE_MOTION.reducedFadeMs).reduceMotion(ReduceMotion.Never);

/** The breathing room under the actions when there is no inset to clear. */
const BAR_MIN_BOTTOM = 8;

/**
 * The actions for what is picked, over the bottom edge of the root.
 *
 * Absolute, so it sits over the list rather than shrinking it — pad the bottom
 * of the list so its last row can scroll clear. Hidden while nothing is picked
 * unless `isShownWhenEmpty`, and never shown with the mode off. It slides up
 * and fades in; under reduced motion it only fades.
 *
 * `edge` pads its own bottom with the safe-area inset. `floating` lifts the
 * whole card by it instead, so the card keeps its own padding.
 */
export function SelectionModeBar({
	placement = "edge",
	isShownWhenEmpty = false,
	isSafeAreaAware = true,
	className,
	style,
	children,
	...props
}: SelectionModeBarProps): ReactElement | null {
	const { isActive, count } = useSelectionModePart("SelectionMode.Bar");
	const isReducedMotion = useReducedMotion();
	const insets = useSafeAreaInsets();
	const inset = isSafeAreaAware ? insets.bottom : 0;

	if (!resolveBarVisible({ count, isActive, isShownWhenEmpty })) return null;

	const placementStyle = placement === "edge" ? { paddingBottom: Math.max(inset, BAR_MIN_BOTTOM) } : { bottom: inset };

	return (
		<Animated.View
			className={selectionModeVariants({ placement }).bar({ className })}
			entering={isReducedMotion ? REDUCED_ENTERING : ENTERING}
			exiting={isReducedMotion ? REDUCED_EXITING : EXITING}
			style={[placementStyle, style]}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
SelectionModeBar.displayName = "DelacourUI.SelectionMode.Bar";
