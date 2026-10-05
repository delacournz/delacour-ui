import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useOptionalTooltipContent } from "./tooltip.context";
import { TOOLTIP_DEFAULTS, tooltipVariants } from "./tooltip.variants";

export type TooltipTitleProps = TextPresetProps;

/**
 * A heading over a description, for the surface variant — a `Text.Label`, the
 * size a popover's title takes. Not announced as a header: the panel is hidden
 * from assistive technology, and its words reach the trigger through `label`.
 *
 * @example
 * <Tooltip.Title>Sync</Tooltip.Title>
 */
export function TooltipTitle({ className, ...props }: TooltipTitleProps): ReactElement {
	const variant = useOptionalTooltipContent()?.variant ?? TOOLTIP_DEFAULTS.variant;
	return <Text.Label className={tooltipVariants({ variant }).title({ className })} {...props} />;
}
TooltipTitle.displayName = "DelacourUI.Tooltip.Title";
