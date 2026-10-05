import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { toastVariants } from "./toast.variants";

export type ToastDescriptionProps = TextPresetProps;

/** A line under the title, always muted, so a long explanation never shouts. */
export function ToastDescription({ className, ...props }: ToastDescriptionProps): ReactElement {
	return <Text className={toastVariants().description({ className })} {...props} />;
}
ToastDescription.displayName = "DelacourUI.Toast.Description";
