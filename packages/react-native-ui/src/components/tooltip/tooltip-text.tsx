import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useOptionalTooltipContent } from "./tooltip.context";
import { TOOLTIP_DEFAULTS, tooltipVariants } from "./tooltip.variants";

export type TooltipTextProps = TextPresetProps;

/**
 * The one-line label — a `Text.Caption`, inked for the panel it sits on: the
 * background colour on an inverted chip, the popover foreground on a surface
 * card. Caption rather than label because a tooltip is an aside to its
 * control, not a second control.
 *
 * @example
 * <Tooltip.Text>Share</Tooltip.Text>
 */
export function TooltipText({ className, ...props }: TooltipTextProps): ReactElement {
	const variant = useOptionalTooltipContent()?.variant ?? TOOLTIP_DEFAULTS.variant;
	return <Text.Caption className={tooltipVariants({ variant }).text({ className })} {...props} />;
}
TooltipText.displayName = "DelacourUI.Tooltip.Text";
