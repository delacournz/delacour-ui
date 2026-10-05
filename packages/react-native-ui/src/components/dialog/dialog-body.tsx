import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { dialogVariants } from "./dialog.variants";

export type DialogBodyProps = ViewProps & { className?: string };

/**
 * Whatever the dialog asks for between the header and the footer — a field, a
 * checkbox, a short list. Optional: a confirmation is a header and a footer.
 *
 * It does not scroll. Content long enough to need it belongs in a `BottomSheet`.
 *
 * @example
 * <Dialog.Body>
 *   <Input placeholder="Project name" />
 * </Dialog.Body>
 */
export function DialogBody({ className, ...props }: DialogBodyProps): ReactElement {
	return <View className={dialogVariants().body({ className })} {...props} />;
}
DialogBody.displayName = "DelacourUI.Dialog.Body";
