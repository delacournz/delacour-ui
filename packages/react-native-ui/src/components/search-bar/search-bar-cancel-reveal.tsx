import { type ReactElement, type ReactNode, useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { SEARCH_BAR_CANCEL_DURATION, searchBarVariants } from "./search-bar.variants";

const TIMING = { duration: SEARCH_BAR_CANCEL_DURATION, easing: Easing.out(Easing.cubic) };

export type SearchBarCancelRevealProps = {
	isVisible: boolean;
	children: ReactNode;
};

/**
 * Slides the Cancel action in beside the field and out again.
 *
 * The width animates from zero to Cancel's own, so the field gives up exactly
 * the room Cancel needs, smoothly, rather than snapping narrower. That width is
 * measured once, on a first frame drawn out of the row and invisible — inside a
 * zero-width clip a label would wrap to nothing and report the wrong size. The
 * gap to the field is padding inside the measured width, so it collapses with
 * Cancel instead of leaving a margin beside a hidden button.
 *
 * Under calm motion — reduce motion, or an E2E build — the width snaps and only
 * the opacity fades. Hidden, it is out of the accessibility tree and takes no
 * touches, so a swipe through the screen never lands on an invisible button.
 */
export function SearchBarCancelReveal({ isVisible, children }: SearchBarCancelRevealProps): ReactElement {
	const isCalm = useCalmMotion();
	const slots = searchBarVariants();
	const [width, setWidth] = useState<number | null>(null);

	// Seeded from the settled state, so a bar mounted with Cancel showing does
	// not slide it in on its first paint.
	const target = isVisible ? 1 : 0;
	const reveal = useSharedValue(target);
	const opacity = useSharedValue(target);
	const measured = useSharedValue(0);

	useEffect(() => {
		reveal.value = isCalm ? target : withTiming(target, TIMING);
		opacity.value = withTiming(target, TIMING);
	}, [isCalm, opacity, reveal, target]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const next = event.nativeEvent.layout.width;
			measured.value = next;
			setWidth(next);
		},
		[measured]
	);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		width: reveal.value * measured.value,
	}));

	const hidden = {
		accessibilityElementsHidden: !isVisible,
		importantForAccessibility: isVisible ? ("auto" as const) : ("no-hide-descendants" as const),
		pointerEvents: isVisible ? ("auto" as const) : ("none" as const),
	};

	// The measuring frame: Cancel at its natural width, out of the row and
	// invisible, until it has reported that width once.
	if (width === null) {
		return (
			<View
				accessibilityElementsHidden
				className={slots.cancelMeasure()}
				importantForAccessibility="no-hide-descendants"
				pointerEvents="none"
			>
				<View className={slots.cancelContent()} onLayout={handleLayout}>
					{children}
				</View>
			</View>
		);
	}

	return (
		<Animated.View className={slots.cancel()} style={animatedStyle} {...hidden}>
			<View className={slots.cancelContent()} style={{ width }}>
				{children}
			</View>
		</Animated.View>
	);
}
SearchBarCancelReveal.displayName = "DelacourUI.SearchBar.CancelReveal";
