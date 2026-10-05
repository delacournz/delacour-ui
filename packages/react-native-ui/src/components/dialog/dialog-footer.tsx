import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useDialogSize } from "./dialog.context";
import { type DialogFooterVariant, dialogVariants, resolveDialogFooterDirection } from "./dialog.variants";

export type DialogFooterProps = ViewProps & {
	className?: string;
	/** `plain` sits inside the card's padding; `panel` bleeds to its edges on a muted band. Default `plain`. */
	variant?: DialogFooterVariant;
};

/**
 * The dialog's actions.
 *
 * A right-aligned row on every size but `sm`, where two labelled buttons side
 * by side would truncate, so they stack full width in written order — write the
 * primary action last and it sits last either way. The direction follows the
 * card's size from `Dialog.Content`; `resolveDialogFooterDirection` is the rule.
 *
 * @example
 * <Dialog.Footer variant="panel">
 *   <Dialog.Close asChild><Button variant="secondary">Cancel</Button></Dialog.Close>
 *   <Button onPress={save}>Save</Button>
 * </Dialog.Footer>
 */
export function DialogFooter({ className, variant = "plain", ...props }: DialogFooterProps): ReactElement {
	const size = useDialogSize();
	const footerDirection = resolveDialogFooterDirection(size);

	return <View className={dialogVariants({ footer: variant, footerDirection }).footer({ className })} {...props} />;
}
DialogFooter.displayName = "DelacourUI.Dialog.Footer";
