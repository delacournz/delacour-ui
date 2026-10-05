import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { DialogSize } from "./dialog.variants";

/** Anything `AccessibilityInfo.setAccessibilityFocus` can be pointed at through `findNodeHandle`. */
export type DialogFocusTarget = object;

export type DialogContextValue = {
	/** Whether the dialog is open — the owner's state, not the exit animation's. */
	isOpen: boolean;
	/** Opens or closes it. Reports through `onOpenChange` only when the value changes. */
	setOpen: (isOpen: boolean) => void;
	/** `setOpen(false)`, for an action inside the card. */
	close: () => void;
	/** Whether the scrim, Android back and the iOS escape gesture close it. */
	isDismissible: boolean;
	/** The `nativeID` `Dialog.Title` carries and the card is labelled by. */
	titleId: string;
	/** The `nativeID` `Dialog.Description` carries. */
	descriptionId: string;
};

/**
 * What the parts share that a caller has no use for: where focus goes on open
 * and on close, and the card's size for the footer.
 */
export type DialogInternalValue = DialogContextValue & {
	/** The trigger, so focus can return to it on close. */
	triggerRef: RefObject<DialogFocusTarget | null>;
	/** The title, so focus can land on it on open. */
	titleRef: RefObject<DialogFocusTarget | null>;
};

const DialogContext = createContext<DialogInternalValue | null>(null);

/** The card's size, provided by `Dialog.Content` so the footer can choose its direction. */
const DialogSizeContext = createContext<DialogSize>("md");

/**
 * Supplies the dialog's state to its parts.
 *
 * Lives in its own module, importing nothing but `dialog.variants`' types, so a
 * part can read it without importing `./dialog` — that import would close a
 * cycle, and Metro serves a partially initialised module for one.
 */
export function DialogProvider({ value, children }: { value: DialogInternalValue; children: ReactNode }): ReactElement {
	return <DialogContext value={value}>{children}</DialogContext>;
}
DialogProvider.displayName = "DelacourUI.Dialog.Provider";

/** Supplies the card's size to the parts inside `Dialog.Content`. */
export function DialogSizeProvider({ value, children }: { value: DialogSize; children: ReactNode }): ReactElement {
	return <DialogSizeContext value={value}>{children}</DialogSizeContext>;
}
DialogSizeProvider.displayName = "DelacourUI.Dialog.SizeProvider";

/** The enclosing dialog's context, or null outside a `<Dialog>`. */
export function useDialogContext(): DialogContextValue | null {
	return use(DialogContext);
}

/**
 * Reads the enclosing dialog's open state, its setter and its ids.
 *
 * Lets a custom child close the dialog — a form's submit, say — without the
 * caller threading a setter down. Throws outside a `<Dialog>`.
 */
export function useDialog(): DialogContextValue {
	const context = use(DialogContext);
	if (!context) {
		throw new Error("useDialog must be called inside a <Dialog>.");
	}
	return context;
}

/**
 * The full context, for a part that cannot work without one. Internal: not
 * re-exported from `index.ts`.
 */
export function useDialogPart(component: string): DialogInternalValue {
	const context = use(DialogContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Dialog>.`);
	}
	return context;
}

/** The card's size. `md` outside `Dialog.Content`. */
export function useDialogSize(): DialogSize {
	return use(DialogSizeContext);
}
