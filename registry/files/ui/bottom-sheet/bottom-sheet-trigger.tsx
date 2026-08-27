import { type ReactElement, useCallback } from "react";
import { Slot } from "@registry/lib/slot";
import { Pressable, type PressableProps } from "@registry/ui/pressable";
import { useBottomSheetPart } from "./bottom-sheet.context";

export type BottomSheetTriggerProps = PressableProps;

/**
 * The control that opens the sheet.
 *
 * On its own it is a `Pressable`, so `feedback`, `haptic` and the rest are
 * inherited rather than restated. It opens through the same state a controlled
 * `isOpen` drives, so a sheet can be opened from here and from elsewhere on the
 * same screen without the two disagreeing, and a caller's own `onPress` still
 * runs after the open.
 *
 * **`asChild` donates the press rather than wrapping the child**, which is where
 * it differs from `Pressable`'s own. `Pressable asChild` keeps its gesture and
 * renders the child inside it — correct for a child that is not itself a
 * control, and wrong here, because the thing anyone wraps in a trigger is a
 * `Button`. Two tap gestures in an ancestor/descendant pair are not
 * simultaneous, so Gesture Handler gives the press to the DESCENDANT: the
 * button's own detector wins, fires the `onPress` it does not have, and the
 * sheet never opens. Nothing announces this — the press simply does nothing.
 *
 * So the trigger hands its `onPress` down as a prop instead, through `Slot`,
 * which chains it ahead of any the child already had. The child keeps its own
 * gesture, its own feedback and its own haptic, and there is still no extra view
 * in the tree.
 *
 * The corollary: **the child has to be something that handles `onPress`.** A
 * `View` or a `Text` takes the prop and ignores it. Wrap a `Button`, a
 * `ListGroup.Item`, or anything else built on `Pressable`.
 *
 * @example
 * <BottomSheet.Trigger asChild>
 *   <Button variant="secondary">Open</Button>
 * </BottomSheet.Trigger>
 *
 * @example
 * // No asChild: the trigger is its own pressable.
 * <BottomSheet.Trigger className="p-4">
 *   <Text>Open</Text>
 * </BottomSheet.Trigger>
 */
export function BottomSheetTrigger({
	asChild = false,
	children,
	onPress,
	...props
}: BottomSheetTriggerProps): ReactElement {
	const { open } = useBottomSheetPart("BottomSheet.Trigger");

	const handlePress = useCallback(() => {
		open();
		onPress?.();
	}, [onPress, open]);

	if (asChild) {
		return (
			<Slot onPress={handlePress} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable onPress={handlePress} {...props}>
			{children}
		</Pressable>
	);
}
BottomSheetTrigger.displayName = "DelacourUI.BottomSheet.Trigger";
