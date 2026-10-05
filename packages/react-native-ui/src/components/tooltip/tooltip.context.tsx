import { createContext, useContext } from "react";
import type { AnchoredSize, AnchorRect, PopoverPlacement } from "../popover/popover.position";
import type { MeasurableNode } from "../popover/use-anchor-measure";
import type { TooltipGesture, TooltipOpenOn, TooltipVariant } from "./tooltip.variants";

/** What `Tooltip` shares with its parts. */
export type TooltipContextValue = {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	close: () => void;
	openOn: TooltipOpenOn;
	/** The tooltip's words, for the trigger's label or hint. */
	label: string | undefined;
	/** ms after the entrance settles before it hides; 0 for never. Already resolved against the screen reader. */
	duration: number;
	/** The trigger reports a gesture; the root decides whether it toggles. */
	activate: (gesture: TooltipGesture) => void;
	/** The trigger reports that a touch started on it — before the provider hears the same touch. */
	onTriggerTouchStart: () => void;
	/** The panel reports that a touch started on it, so a scrollable body is not an outside tap. */
	onContentTouchStart: () => void;
	/** The trigger's frame in window coordinates, `null` until it is measured on open. */
	anchorRect: AnchorRect | null;
	/** The callback ref `Tooltip.Trigger` measures through. */
	triggerRef: (node: MeasurableNode | null) => void;
};

export const TooltipContext = createContext<TooltipContextValue | null>(null);
TooltipContext.displayName = "DelacourUI.Tooltip.Context";

/**
 * The tooltip a part sits in — open state and the close. Throws outside a
 * `<Tooltip>`.
 *
 * @example
 * function Hint() {
 *   const { isOpen } = useTooltip();
 *   return isOpen ? <Text.Caption>Shown</Text.Caption> : null;
 * }
 */
export function useTooltip(): Pick<TooltipContextValue, "isOpen" | "setOpen" | "close"> {
	const context = useContext(TooltipContext);
	if (context === null) throw new Error("useTooltip must be used inside a <Tooltip>.");
	return context;
}

/** The full context, for the parts. Throws outside a `<Tooltip>`. */
export function useTooltipContext(): TooltipContextValue {
	const context = useContext(TooltipContext);
	if (context === null) throw new Error("Tooltip parts must be used inside a <Tooltip>.");
	return context;
}

/** What `Tooltip.Content` shares with the parts drawn inside the panel. */
export type TooltipContentContextValue = {
	variant: TooltipVariant;
	placement: PopoverPlacement;
	arrowOffset: number;
	size: AnchoredSize;
};

export const TooltipContentContext = createContext<TooltipContentContextValue | null>(null);
TooltipContentContext.displayName = "DelacourUI.Tooltip.ContentContext";

/** The panel's variant and placement, or `null` outside `Tooltip.Content`. */
export function useOptionalTooltipContent(): TooltipContentContextValue | null {
	return useContext(TooltipContentContext);
}
