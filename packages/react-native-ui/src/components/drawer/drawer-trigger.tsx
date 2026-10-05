import { type ReactElement, useCallback } from "react";
import { composeRefs } from "../../lib/compose-refs";
import { Slot } from "../../lib/slot";
import { Pressable, type PressableProps } from "../pressable";
import { useDrawerPart } from "./drawer.context";

export type DrawerTriggerProps = PressableProps;

/**
 * The control that opens the drawer.
 *
 * On its own it is this library's `Pressable`. **`asChild` donates the press
 * rather than wrapping the child**, the way `BottomSheet.Trigger` does: two tap
 * gestures in an ancestor/descendant pair are not simultaneous, so a `Button`
 * wrapped in a pressable trigger would win the touch and the drawer would never
 * open. With `asChild` the open is chained ahead of the child's own `onPress`.
 *
 * The trigger's ref is kept so accessibility focus can return to it when the
 * drawer closes.
 *
 * @example
 * <Drawer.Trigger asChild>
 *   <Button accessibilityLabel="Menu" size="icon-md" variant="ghost">
 *     <Icon icon={IconMenu} />
 *   </Button>
 * </Drawer.Trigger>
 */
export function DrawerTrigger({ asChild = false, children, onPress, ref, ...props }: DrawerTriggerProps): ReactElement {
	const { setOpen, triggerRef } = useDrawerPart("Drawer.Trigger");

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
DrawerTrigger.displayName = "DelacourUI.Drawer.Trigger";
