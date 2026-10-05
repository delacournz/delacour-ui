import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useOptionalPopoverContent } from "./popover.context";
import { popoverVariants } from "./popover.variants";

export type PopoverTitleProps = TextPresetProps;

/**
 * The panel's heading.
 *
 * *Is* a `Text.Label`, announced as a header — a popover is a small panel, and a
 * section heading's 20pt would outweigh the trigger it hangs from. The slot adds
 * clearance for `Popover.Close` and no type of its own. It carries the
 * `nativeID` the panel is labelled by, and accessibility focus lands on it when
 * the panel opens.
 *
 * @example
 * <Popover.Title>Rename</Popover.Title>
 */
export function PopoverTitle({ className, ...props }: PopoverTitleProps): ReactElement {
	const content = useOptionalPopoverContent();

	return (
		<Text.Label
			accessibilityRole="header"
			className={popoverVariants().title({ className })}
			nativeID={content?.titleId}
			ref={content?.titleRef}
			{...props}
		/>
	);
}
PopoverTitle.displayName = "DelacourUI.Popover.Title";
