import { type ReactElement, useEffect } from "react";
import type { ViewProps, ViewStyle } from "react-native";
import Animated, {
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { IconCheckmark1Small } from "../../icons/central";
import { Icon } from "../icon";
import { useSelectionModeItemContext, useSelectionModePart } from "./selection-mode.context";
import { SELECTION_MODE_CHECK_TOKEN, SELECTION_MODE_MOTION, selectionModeVariants } from "./selection-mode.variants";

export type SelectionModeIndicatorProps = ViewProps & {
	/** The id it reports on. Defaults to the enclosing `SelectionMode.Item`'s. */
	value?: string;
	className?: string;
};

/**
 * Animates a picked state in: the check fades, and the whole mark pops from 0.8
 * on a spring. Under reduced motion the pop is dropped and the fade is 150ms.
 */
function usePickedStyle(isSelected: boolean): ReturnType<typeof useAnimatedStyle<ViewStyle>> {
	const isReducedMotion = useReducedMotion();
	const picked = useSharedValue(isSelected ? 1 : 0);
	const scale = useSharedValue(1);

	useEffect(() => {
		const target = isSelected ? 1 : 0;
		if (isReducedMotion) {
			picked.value = withTiming(target, {
				duration: SELECTION_MODE_MOTION.reducedFadeMs,
				reduceMotion: ReduceMotion.Never,
			});
			return;
		}
		picked.value = withTiming(target, { duration: SELECTION_MODE_MOTION.fadeMs });
		if (isSelected)
			scale.value = withSequence(withTiming(0.8, { duration: 0 }), withSpring(1, SELECTION_MODE_MOTION.spring));
	}, [isReducedMotion, isSelected, picked, scale]);

	return useAnimatedStyle(() => ({ opacity: picked.value, transform: [{ scale: scale.value }] }));
}

/**
 * The round mark a `leading` item shows: an empty ring, or a filled circle with
 * a check.
 *
 * Round on purpose. A square box is a form control being filled in; a round
 * one is a thing picked out of a set. `Checkbox` stays square.
 *
 * Rendered by `SelectionMode.Item` itself. Render one by hand only for an item
 * drawn with `indicator="none"` that wants the mark somewhere else in its
 * layout — inside an item it reads that item's id, elsewhere it takes `value`.
 */
export function SelectionModeIndicator({ value, className, ...props }: SelectionModeIndicatorProps): ReactElement {
	const selection = useSelectionModePart("SelectionMode.Indicator");
	const item = useSelectionModeItemContext();
	const id = value ?? item?.value;
	if (id === undefined) {
		throw new Error("SelectionMode.Indicator needs a `value`, or an enclosing <SelectionMode.Item>.");
	}

	const isSelected = selection.isSelected(id);
	const slots = selectionModeVariants({ isSelected });
	const checkStyle = usePickedStyle(isSelected);

	return (
		<Animated.View
			accessibilityElementsHidden
			className={slots.indicator({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		>
			<Animated.View style={checkStyle}>
				<Icon className={slots.indicatorCheck()} color={SELECTION_MODE_CHECK_TOKEN} icon={IconCheckmark1Small} />
			</Animated.View>
		</Animated.View>
	);
}
SelectionModeIndicator.displayName = "DelacourUI.SelectionMode.Indicator";

/**
 * The `ring` indicator: a primary ring a 2pt gap outside the item, and a small
 * check badge at its top-end corner. Drawn only while the item is picked.
 *
 * Internal — `SelectionMode.Item` renders it. `className` reshapes the ring to
 * the item's own corner: `rounded-full` around a round swatch.
 */
export function SelectionModeRing({
	isSelected,
	className,
}: {
	isSelected: boolean;
	className?: string;
}): ReactElement {
	const slots = selectionModeVariants({ indicator: "ring", isSelected });
	const pickedStyle = usePickedStyle(isSelected);

	return (
		<Animated.View
			accessibilityElementsHidden
			className={slots.ring({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={pickedStyle}
		>
			<Animated.View className={slots.ringBadge()}>
				<Icon className={slots.indicatorCheck()} color={SELECTION_MODE_CHECK_TOKEN} icon={IconCheckmark1Small} />
			</Animated.View>
		</Animated.View>
	);
}
SelectionModeRing.displayName = "DelacourUI.SelectionMode.Item.Ring";
