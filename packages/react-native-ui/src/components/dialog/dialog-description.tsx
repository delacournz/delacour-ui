import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Text, type TextPresetProps } from "../text";
import { useDialogPart } from "./dialog.context";

export type DialogDescriptionProps = TextPresetProps;

/**
 * Supporting copy under the title.
 *
 * *Is* a `Text.Paragraph`, muted by default so the title and this read as a
 * hierarchy rather than two equal lines. `color` is an ordinary prop. It has no
 * slot in `dialogVariants` — see the note there.
 *
 * @example
 * <Dialog.Description>This cannot be undone.</Dialog.Description>
 */
export function DialogDescription({ className, color = "muted", ...props }: DialogDescriptionProps): ReactElement {
	const { descriptionId } = useDialogPart("Dialog.Description");

	return <Text.Paragraph className={cn(className)} color={color} nativeID={descriptionId} {...props} />;
}
DialogDescription.displayName = "DelacourUI.Dialog.Description";
