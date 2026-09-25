import { type ReactElement, useCallback } from "react";
import { type GestureResponderEvent, Pressable } from "react-native";
import { Slot } from "../lib/slot";
import { useBottomSheet } from "./bottom-sheet.context";
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
 */
export function BottomSheetTrigger({
	asChild = false,
	children,
	onPress,
	...props
}: BottomSheetTriggerProps): ReactElement {
	const { open } = useBottomSheet();

	const handlePress = useCallback(
		(event: GestureResponderEvent) => {
			open();
			onPress?.(event);
		},
		[open, onPress]
	);

	if (asChild) {
		return (
			<Slot onPress={handlePress} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable accessibilityRole="button" onPress={handlePress} {...props}>
			{children}
		</Pressable>
	);
}
BottomSheetTrigger.displayName = "DelacourBottomSheet.BottomSheet.Trigger";
