import { createContext, type RefObject, useContext } from "react";
import type { AnchoredSize, AnchorRect, PopoverPlacement } from "./popover.position";
import type { MeasurableNode } from "./use-anchor-measure";

/** What `Popover` shares with its parts. */
export type PopoverContextValue = {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	close: () => void;
	isDismissible: boolean;
	/** The side the panel ended up on, after any flip — the preferred side until it is placed. */
	placement: PopoverPlacement;
	/** `Popover.Content` reports where it was placed. */
	onPlaced: (placement: PopoverPlacement) => void;
	/** The anchor's frame in window coordinates, `null` until it is measured on open. */
	anchorRect: AnchorRect | null;
	/** The callback ref `Popover.Trigger` measures through. */
	triggerRef: (node: MeasurableNode | null) => void;
	/** The trigger's node — where accessibility focus returns on close. */
	triggerNode: RefObject<MeasurableNode | null>;
	/** The callback ref `Popover.Anchor` measures through. */
	anchorRef: (node: MeasurableNode | null) => void;
	/** `Popover.Anchor` registers while mounted, which takes the measuring from the trigger. */
	registerAnchor: () => () => void;
};

export const PopoverContext = createContext<PopoverContextValue | null>(null);
PopoverContext.displayName = "DelacourUI.Popover.Context";

/**
 * The popover a part sits in — open state, the resolved placement and the
 * close. Throws outside a `<Popover>`.
 *
 * @example
 * function Done() {
 *   const { close } = usePopover();
 *   return <Button onPress={close}>Done</Button>;
 * }
 */
export function usePopover(): Pick<PopoverContextValue, "isOpen" | "setOpen" | "close" | "placement"> {
	const context = useContext(PopoverContext);
	if (context === null) throw new Error("usePopover must be used inside a <Popover>.");
	return context;
}

/** The full context, for the parts. Throws outside a `<Popover>`. */
export function usePopoverContext(): PopoverContextValue {
	const context = useContext(PopoverContext);
	if (context === null) throw new Error("Popover parts must be used inside a <Popover>.");
	return context;
}

/** What `Popover.Content` shares with the parts drawn inside the panel. */
export type PopoverContentContextValue = {
	placement: PopoverPlacement;
	arrowOffset: number;
	size: AnchoredSize;
	isUnstyled: boolean;
	/** The title's `nativeID`, which the panel is labelled by. */
	titleId: string;
	/** The callback ref `Popover.Title` hands its node to — where accessibility focus lands on open. */
	titleRef: (node: MeasurableNode | null) => void;
};

export const PopoverContentContext = createContext<PopoverContentContextValue | null>(null);
PopoverContentContext.displayName = "DelacourUI.Popover.ContentContext";

/** The panel's placement, or `null` outside `Popover.Content`. */
export function useOptionalPopoverContent(): PopoverContentContextValue | null {
	return useContext(PopoverContentContext);
}
