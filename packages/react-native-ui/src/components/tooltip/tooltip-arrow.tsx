import type { ReactElement } from "react";
import { AnchoredArrow } from "../popover/popover-arrow";
import { useOptionalTooltipContent } from "./tooltip.context";
import { tooltipVariants } from "./tooltip.variants";

export type TooltipArrowProps = {
	className?: string;
};

/**
 * The panel's arrow — Popover's `AnchoredArrow`, wearing the tooltip's paint.
 *
 * Write it anywhere inside `Tooltip.Content`: it reads the resolved placement
 * and offset from the panel, follows a flip, points at the trigger's centre
 * even after the panel shifted along an edge, and is lifted out of a
 * scrollable body. Popover's own paint is stripped and the variant's slot
 * supplies it, so an inverted chip's arrow is the foreground fill with no
 * border and a surface card's is the popover fill with its hairline.
 *
 * @example
 * <Tooltip.Content>
 *   <Tooltip.Arrow />
 *   <Tooltip.Text>Share</Tooltip.Text>
 * </Tooltip.Content>
 */
export function TooltipArrow({ className }: TooltipArrowProps): ReactElement | null {
	const content = useOptionalTooltipContent();
	if (content === null) return null;

	return (
		<AnchoredArrow
			arrowOffset={content.arrowOffset}
			className={tooltipVariants({ variant: content.variant }).arrow({ className })}
			isUnstyled
			placement={content.placement}
			size={content.size}
		/>
	);
}
TooltipArrow.displayName = "DelacourUI.Tooltip.Arrow";
