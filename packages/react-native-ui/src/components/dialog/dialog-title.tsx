import { type ReactElement, useCallback } from "react";
import { Text, type TextPresetProps } from "../text";
import { type DialogFocusTarget, useDialogPart } from "./dialog.context";
import { dialogVariants } from "./dialog.variants";

/**
 * A `Text.Header`'s props less `ref`: the dialog holds the title's ref itself,
 * to move accessibility focus onto it.
 */
export type DialogTitleProps = Omit<TextPresetProps, "ref">;

/**
 * The dialog's heading.
 *
 * *Is* a `Text.Header` — the preset supplies the type, and this adds only the
 * clearance the corner ✕ needs. It carries the `nativeID` the card is labelled
 * by on Android, and it is where accessibility focus lands once the card has
 * finished entering, so a screen reader announces what the dialog is for first.
 *
 * @example
 * <Dialog.Title>Delete project?</Dialog.Title>
 */
export function DialogTitle({ className, ...props }: DialogTitleProps): ReactElement {
	const { titleId, titleRef } = useDialogPart("Dialog.Title");
	const setTitleRef = useCallback(
		(node: DialogFocusTarget | null) => {
			titleRef.current = node;
		},
		[titleRef]
	);

	return (
		<Text.Header
			accessibilityRole="header"
			className={dialogVariants().title({ className })}
			nativeID={titleId}
			ref={setTitleRef}
			{...props}
		/>
	);
}
DialogTitle.displayName = "DelacourUI.Dialog.Title";
