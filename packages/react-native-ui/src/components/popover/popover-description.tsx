import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { popoverVariants } from "./popover.variants";

export type PopoverDescriptionProps = TextPresetProps;

/**
 * Supporting copy under the title — a `Text.Caption`, so it sits on the muted
 * token at the label's size and reads as the title's explanation rather than a
 * second heading.
 *
 * @example
 * <Popover.Description>Shown to everyone in the workspace.</Popover.Description>
 */
export function PopoverDescription({ className, ...props }: PopoverDescriptionProps): ReactElement {
	return <Text.Caption className={popoverVariants().description({ className })} {...props} />;
}
PopoverDescription.displayName = "DelacourUI.Popover.Description";
