import { type ReactElement, type ReactNode, useCallback, useId, useMemo, useRef } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type DialogFocusTarget, type DialogInternalValue, DialogProvider } from "./dialog.context";
import { DialogBody } from "./dialog-body";
import { DialogClose } from "./dialog-close";
import { DialogContent } from "./dialog-content";
import { DialogDescription } from "./dialog-description";
import { DialogFooter } from "./dialog-footer";
import { DialogHeader } from "./dialog-header";
import { DialogTitle } from "./dialog-title";
import { DialogTrigger } from "./dialog-trigger";

export type DialogProps = {
	/** Whether the dialog is open. Pass it to control the dialog; omit it and the dialog holds its own state. */
	isOpen?: boolean;
	/** Whether an uncontrolled dialog starts open. Default false. */
	defaultOpen?: boolean;
	/** Called with the new value whenever the dialog opens or closes, from any path. */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * Whether a scrim tap, Android back and the iOS escape gesture close it.
	 * `false` makes an alert dialog: only its own actions close it. Default true.
	 */
	isDismissible?: boolean;
	children: ReactNode;
};

function DialogRoot({
	isOpen,
	defaultOpen = false,
	onOpenChange,
	isDismissible = true,
	children,
}: DialogProps): ReactElement {
	const [open, setControllableOpen] = useControllableState({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpen,
	});

	// Every path — trigger, close, scrim, back, escape — lands here, and a
	// second close while the first is still exiting would report twice.
	const setOpen = useCallback(
		(next: boolean) => {
			if (next !== open) setControllableOpen(next);
		},
		[open, setControllableOpen]
	);
	const close = useCallback(() => setOpen(false), [setOpen]);

	const titleId = useId();
	const descriptionId = useId();
	const triggerRef = useRef<DialogFocusTarget | null>(null);
	const titleRef = useRef<DialogFocusTarget | null>(null);

	const value = useMemo<DialogInternalValue>(
		() => ({ close, descriptionId, isDismissible, isOpen: open, setOpen, titleId, titleRef, triggerRef }),
		[close, descriptionId, isDismissible, open, setOpen, titleId]
	);

	return <DialogProvider value={value}>{children}</DialogProvider>;
}

/**
 * A centred card over a dimmed app that asks for a decision or a short input
 * before the user goes on — confirm a delete, rename a file, accept terms.
 *
 * It takes the whole screen. Use a `Popover` when the surrounding context must
 * stay visible, and a `BottomSheet` when the content is long or scrolls. With
 * `isDismissible={false}` it is an alert dialog: only its own actions close it.
 *
 * Draws through `Overlay.Portal`, so the app needs `OverlayProvider` mounted
 * once at its root.
 *
 * @example
 * <Dialog>
 *   <Dialog.Trigger asChild>
 *     <Button variant="destructive">Delete</Button>
 *   </Dialog.Trigger>
 *   <Dialog.Content>
 *     <Dialog.Close />
 *     <Dialog.Header>
 *       <Dialog.Title>Delete project?</Dialog.Title>
 *       <Dialog.Description>This cannot be undone.</Dialog.Description>
 *     </Dialog.Header>
 *     <Dialog.Footer>
 *       <Dialog.Close asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </Dialog.Close>
 *       <Button variant="destructive" onPress={remove}>Delete</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 *
 * @example
 * // Controlled, and an alert dialog.
 * <Dialog isOpen={isOpen} onOpenChange={setIsOpen} isDismissible={false}>
 *   …
 * </Dialog>
 */
export const Dialog = Object.assign(DialogRoot, {
	/** The control that opens it. `asChild` donates the press to a `Button`. */
	Trigger: DialogTrigger,
	/** The portal, scrim and card. Renders nothing while closed. */
	Content: DialogContent,
	/** The ✕ in the corner, or — with `asChild` — any control that closes it. */
	Close: DialogClose,
	/** The column holding the title and description. */
	Header: DialogHeader,
	/** The heading — a `Text.Header` the card is labelled by. */
	Title: DialogTitle,
	/** Muted supporting copy — a `Text.Paragraph`. */
	Description: DialogDescription,
	/** What the dialog asks for, between the header and the footer. */
	Body: DialogBody,
	/** The actions — a row, or a stacked column on an `sm` card. */
	Footer: DialogFooter,
	displayName: "DelacourUI.Dialog",
});
