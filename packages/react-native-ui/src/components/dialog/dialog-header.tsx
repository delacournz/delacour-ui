import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { dialogVariants } from "./dialog.variants";

export type DialogHeaderProps = ViewProps & { className?: string };

/**
 * The column holding `Dialog.Title` and `Dialog.Description`, a tight gap apart
 * so the two read as one block above the body.
 *
 * @example
 * <Dialog.Header>
 *   <Dialog.Title>Delete project?</Dialog.Title>
 *   <Dialog.Description>This cannot be undone.</Dialog.Description>
 * </Dialog.Header>
 */
export function DialogHeader({ className, ...props }: DialogHeaderProps): ReactElement {
	return <View className={dialogVariants().header({ className })} {...props} />;
}
DialogHeader.displayName = "DelacourUI.Dialog.Header";
