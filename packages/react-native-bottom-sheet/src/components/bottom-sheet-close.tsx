import { type ReactElement, useCallback } from "react";
import { type GestureResponderEvent, Pressable } from "react-native";
import { Slot } from "../lib/slot";
import { useBottomSheet } from "./bottom-sheet.context";
import type { BottomSheetCloseProps } from "./bottom-sheet.types";

/**
 * The dismiss control. A `Pressable` on its own; with `asChild` it hands
 * `onPress` to the child, the way `Trigger` does and for the same reason.
 *
 * Closing goes through the same path a swipe-down and an overlay press do, so
 * a caller has one `onOpenChange` to watch rather than three.
 */
export function BottomSheetClose({
	asChild = false,
	children,
	onPress,
	accessibilityLabel = "Close",
	...props
}: BottomSheetCloseProps): ReactElement {
	const { close } = useBottomSheet();

	const handlePress = useCallback(
		(event: GestureResponderEvent) => {
			close();
			onPress?.(event);
		},
		[close, onPress]
	);

	if (asChild) {
		return (
			<Slot accessibilityLabel={accessibilityLabel} onPress={handlePress} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={handlePress} {...props}>
			{children}
		</Pressable>
	);
}
BottomSheetClose.displayName = "DelacourBottomSheet.BottomSheet.Close";
