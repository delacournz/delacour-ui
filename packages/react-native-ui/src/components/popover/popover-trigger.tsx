import type { ReactElement } from "react";
import { Slot } from "../../lib/slot";
import { Pressable, type PressableProps } from "../pressable";
import { usePopoverContext } from "./popover.context";

export type PopoverTriggerProps = PressableProps;

/**
 * The control that opens the popover, and — unless a `Popover.Anchor` is
 * written — the view the panel is anchored to.
 *
 * On its own it is this library's `Pressable`. **`asChild` donates the press**
 * rather than wrapping the child, for `BottomSheet.Trigger`'s reason: two tap
 * gestures in an ancestor/descendant pair give the touch to the descendant, so
 * a `Button` inside a pressable trigger would win it and the popover would
 * never open. The toggle is handed to the child's own `onPress`, chained ahead
 * of one the child already has, and the measuring ref is composed onto the
 * child's own — so the child has to be something built on `Pressable`.
 *
 * Tells assistive technology whether the panel is expanded.
 *
 * @example
 * <Popover.Trigger asChild>
 *   <Button variant="secondary">Rename</Button>
 * </Popover.Trigger>
 */
export function PopoverTrigger({
	asChild = false,
	accessibilityState,
	children,
	onPress,
	...props
}: PopoverTriggerProps): ReactElement {
	const { isOpen, setOpen, triggerRef } = usePopoverContext();

	const toggle = () => {
		setOpen(!isOpen);
		onPress?.();
	};
	const state = { ...accessibilityState, expanded: isOpen };

	if (asChild) {
		return (
			<Slot {...props} accessibilityState={state} onPress={toggle} ref={triggerRef}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable {...props} accessibilityState={state} onPress={toggle} ref={triggerRef}>
			{children}
		</Pressable>
	);
}
PopoverTrigger.displayName = "DelacourUI.Popover.Trigger";
