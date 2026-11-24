import { type ReactElement, useCallback, useMemo } from "react";
import { type GestureResponderEvent, Pressable } from "react-native";
import { composeRefs } from "../lib/compose-refs";
import { Slot } from "../lib/slot";
import { useBottomSheet, useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetTriggerProps } from "./bottom-sheet.types";

/**
 * The control that opens the sheet.
 *
 * On its own it is a React Native `Pressable`. With `asChild` it renders
 * nothing and hands its `onPress` to the child instead, chained ahead of any
 * the child already had — so `<BottomSheet.Trigger asChild><Button /></…>` is
 * the button, with the button's own feedback and haptic, and no extra view.
 *
 * Donating the press rather than wrapping the child is deliberate. Two tap
 * gestures in an ancestor/descendant pair are not simultaneous: Gesture
 * Handler gives the press to the descendant, the button's own detector wins,
 * and a wrapping trigger never fires. The corollary is that the child has to
 * be something that handles `onPress`.
 *
 * It reports `accessibilityState.expanded` while the sheet is open, and is the
 * node focus returns to once the sheet has closed — so with `asChild` the child
 * has to take a `ref`.
 */
export function BottomSheetTrigger({
	asChild = false,
	children,
	onPress,
	ref,
	accessibilityState,
	...props
}: BottomSheetTriggerProps): ReactElement {
	const { open, isOpen } = useBottomSheet();
	const { accessibilityRefs } = useBottomSheetInternal();
	const triggerRef = useMemo(() => composeRefs(accessibilityRefs.trigger, ref), [accessibilityRefs, ref]);
	const state = useMemo(() => ({ ...accessibilityState, expanded: isOpen }), [accessibilityState, isOpen]);

	const handlePress = useCallback(
		(event: GestureResponderEvent) => {
			open();
			onPress?.(event);
		},
		[open, onPress]
	);

	if (asChild) {
		return (
			<Slot accessibilityState={state} onPress={handlePress} ref={triggerRef} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable accessibilityRole="button" accessibilityState={state} onPress={handlePress} ref={triggerRef} {...props}>
			{children}
		</Pressable>
	);
}
BottomSheetTrigger.displayName = "DelacourBottomSheet.BottomSheet.Trigger";
