import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useToastPart } from "./toast.context";
import { toastVariants } from "./toast.variants";

export type ToastTitleProps = TextPresetProps;

/** What happened, in the status's colour — Alert's token for it, the same shade as the glyph. */
export function ToastTitle({ className, ...props }: ToastTitleProps): ReactElement {
	const { status } = useToastPart("Toast.Title");
	return <Text className={toastVariants({ status }).title({ className })} {...props} />;
}
ToastTitle.displayName = "DelacourUI.Toast.Title";
