import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useOptionalTooltipContent } from "./tooltip.context";
import { TOOLTIP_DEFAULTS, tooltipVariants } from "./tooltip.variants";

export type TooltipDescriptionProps = TextPresetProps;

/**
 * Supporting copy under the title — a `Text.Caption`, muted on a surface card
 * and the background colour at 80% on an inverted chip.
 *
 * @example
 * <Tooltip.Description>Changes reach your other devices within a minute.</Tooltip.Description>
 */
export function TooltipDescription({ className, ...props }: TooltipDescriptionProps): ReactElement {
	const variant = useOptionalTooltipContent()?.variant ?? TOOLTIP_DEFAULTS.variant;
	return <Text.Caption className={tooltipVariants({ variant }).description({ className })} {...props} />;
}
TooltipDescription.displayName = "DelacourUI.Tooltip.Description";
