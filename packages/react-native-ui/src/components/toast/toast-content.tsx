import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { toastVariants } from "./toast.variants";

export type ToastContentProps = ViewProps & { className?: string };

/** The column holding the title and the description; takes the width the glyph and the controls leave. */
export function ToastContent({ className, ...props }: ToastContentProps): ReactElement {
	return <View className={toastVariants().content({ className })} {...props} />;
}
ToastContent.displayName = "DelacourUI.Toast.Content";
