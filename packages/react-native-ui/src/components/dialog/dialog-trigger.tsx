import { type ReactElement, useCallback } from "react";
import { composeRefs } from "../../lib/compose-refs";
import { Slot } from "../../lib/slot";
import { Pressable, type PressableProps } from "../pressable";
import { useDialogPart } from "./dialog.context";

export type DialogTriggerProps = PressableProps;

/**
 * The control that opens the dialog.
 *
 * On its own it is this library's `Pressable`. **`asChild` donates the press
 * rather than wrapping the child**, the way `BottomSheet.Trigger` does: two tap
 * gestures in an ancestor/descendant pair are not simultaneous, so a `Button`
 * wrapped in a pressable trigger would win the touch and the dialog would never
 * open. With `asChild` the open is chained ahead of the child's own `onPress`,
 * and the child keeps its gesture, feedback and haptic — so the child has to be
 * something that handles `onPress`.
 *
 * The trigger's ref is kept so accessibility focus can return to it when the
 * dialog closes.
 *
 * @example
 * <Dialog.Trigger asChild>
 *   <Button variant="destructive">Delete</Button>
 * </Dialog.Trigger>
 */
export function DialogTrigger({ asChild = false, children, onPress, ref, ...props }: DialogTriggerProps): ReactElement {
	const { setOpen, triggerRef } = useDialogPart("Dialog.Trigger");

	const handlePress = useCallback(() => {
		setOpen(true);
		onPress?.();
	}, [setOpen, onPress]);

	const composedRef = composeRefs(ref, (node) => {
		triggerRef.current = node;
	});

	if (asChild) {
		return (
			<Slot onPress={handlePress} ref={composedRef} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable accessibilityRole="button" onPress={handlePress} ref={composedRef} {...props}>
			{children}
		</Pressable>
	);
}
DialogTrigger.displayName = "DelacourUI.Dialog.Trigger";
