import { type ReactElement, useEffect } from "react";
import { View, type ViewProps } from "react-native";
import { Slot } from "../../lib/slot";
import { usePopoverContext } from "./popover.context";

export type PopoverAnchorProps = ViewProps & {
	className?: string;
	/** Anchor to the single child itself rather than a wrapping view. */
	asChild?: boolean;
};

/**
 * Anchors the panel to a different view than the trigger — a whole row whose
 * trailing button opens it, a field whose icon does.
 *
 * While it is mounted the panel measures this instead of the trigger; the
 * trigger still opens it and still takes focus back on close. Without
 * `asChild` it is a plain `View` that never collapses, so it always has a
 * native frame to measure.
 *
 * @example
 * <Popover>
 *   <Popover.Anchor className="flex-row items-center gap-2">
 *     <Input value={tag} />
 *     <Popover.Trigger asChild><Button size="icon-md" variant="ghost">…</Button></Popover.Trigger>
 *   </Popover.Anchor>
 *   <Popover.Content width="trigger">…</Popover.Content>
 * </Popover>
 */
export function PopoverAnchor({ asChild = false, children, ...props }: PopoverAnchorProps): ReactElement {
	const { anchorRef, registerAnchor } = usePopoverContext();

	useEffect(() => registerAnchor(), [registerAnchor]);

	if (asChild) {
		return (
			<Slot {...props} ref={anchorRef}>
				{children}
			</Slot>
		);
	}

	return (
		<View collapsable={false} {...props} ref={anchorRef}>
			{children}
		</View>
	);
}
PopoverAnchor.displayName = "DelacourUI.Popover.Anchor";
