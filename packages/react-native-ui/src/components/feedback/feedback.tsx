import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Dialog } from "../dialog";
import { type FeedbackInternalValue, FeedbackProvider } from "./feedback.context";
import { FeedbackAction } from "./feedback-action";
import { FeedbackCancel } from "./feedback-cancel";
import { FeedbackClose } from "./feedback-close";
import { FeedbackContent } from "./feedback-content";
import { FeedbackField } from "./feedback-field";
import { FeedbackFooter } from "./feedback-footer";
import { FeedbackPanel } from "./feedback-panel";
import { FeedbackSubmit } from "./feedback-submit";
import { FeedbackTitle } from "./feedback-title";
import { FeedbackTrigger } from "./feedback-trigger";

export type FeedbackProps = {
	/** Whether the dialog is open. Pass it to control the dialog; omit it and the dialog holds its own state. */
	isOpen?: boolean;
	/** Whether an uncontrolled dialog starts open. Default false. */
	defaultOpen?: boolean;
	/** Called with the new value whenever the dialog opens or closes, from any path. */
	onOpenChange?: (isOpen: boolean) => void;
	/** The draft. Pass it to control the text; omit it and the dialog keeps its own draft. */
	value?: string;
	/** The draft an uncontrolled dialog starts with. Default "". */
	defaultValue?: string;
	/** Called with the draft on every keystroke, and on `clear()`. */
	onValueChange?: (value: string) => void;
	/** Whether a scrim tap, Android back and the iOS escape gesture close it. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};

function FeedbackRoot({
	isOpen,
	defaultOpen = false,
	onOpenChange,
	value,
	defaultValue = "",
	onValueChange,
	isDismissible = true,
	children,
}: FeedbackProps): ReactElement {
	const [open, setOpen] = useControllableState({ defaultValue: defaultOpen, onChange: onOpenChange, value: isOpen });
	const [draft, setDraft] = useControllableState({ defaultValue, onChange: onValueChange, value });
	const [isSending, setSending] = useState(false);
	const [titleText, setTitleText] = useState<string | undefined>(undefined);

	const close = useCallback(() => {
		if (open) setOpen(false);
	}, [open, setOpen]);
	const clear = useCallback(() => setDraft(""), [setDraft]);

	const context = useMemo<FeedbackInternalValue>(
		() => ({
			clear,
			close,
			isOpen: open,
			isSending,
			setSending,
			setTitleText,
			setValue: setDraft,
			titleText,
			value: draft,
		}),
		[clear, close, draft, isSending, open, setDraft, titleText]
	);

	// The draft lives here, above `Dialog.Content`, which unmounts once the exit
	// animation ends — so an uncontrolled draft survives a close and a reopen.
	return (
		<Dialog isDismissible={isDismissible} isOpen={open} onOpenChange={setOpen}>
			<FeedbackProvider value={context}>{children}</FeedbackProvider>
		</Dialog>
	);
}

/**
 * A dialog for writing — "What should we fix first?", a bug report, a
 * one-question survey.
 *
 * It is a `Dialog` whose text field sits in a recessed well, with the actions
 * on the band around it. Open state, portal, scrim, back, escape, focus and the
 * keyboard lift are all Dialog's; this adds the draft, a submit that waits for
 * the send, and a well that eases between heights when a multi-step flow swaps
 * its content. Not for confirmations or warnings — use a `Dialog`.
 *
 * The draft is kept across close and reopen while uncontrolled;
 * `useFeedback().clear()` empties it. `Feedback.Submit` never closes the
 * dialog: close from `onSubmit` once the send has gone through.
 *
 * Draws through `Overlay.Portal`, so the app needs `OverlayProvider` mounted
 * once at its root.
 *
 * @example
 * <Feedback>
 *   <Feedback.Trigger asChild>
 *     <Button variant="secondary">Give feedback</Button>
 *   </Feedback.Trigger>
 *   <Feedback.Content>
 *     <Feedback.Panel>
 *       <Feedback.Title>What should we fix first?</Feedback.Title>
 *       <Feedback.Close />
 *       <Feedback.Field placeholder="Tell us what got in your way" />
 *     </Feedback.Panel>
 *     <Feedback.Footer>
 *       <Feedback.Cancel />
 *       <Feedback.Submit onSubmit={send} />
 *     </Feedback.Footer>
 *   </Feedback.Content>
 * </Feedback>
 */
export const Feedback = Object.assign(FeedbackRoot, {
	/** The control that opens it. `asChild` donates the press to a `Button`. */
	Trigger: FeedbackTrigger,
	/** The shell — a `Dialog.Content` on the muted band. Renders nothing while closed. */
	Content: FeedbackContent,
	/** The recessed well holding the title, the close and the field. Eases between heights. */
	Panel: FeedbackPanel,
	/** The question — a `Dialog.Title`, and the field's default label. */
	Title: FeedbackTitle,
	/** The ✕ in the well's corner. Keeps the draft. */
	Close: FeedbackClose,
	/** The multiline text field, bound to the draft. */
	Field: FeedbackField,
	/** The actions, end-aligned on the band under the well. */
	Footer: FeedbackFooter,
	/** A custom footer action — a `secondary` `Button`. */
	Action: FeedbackAction,
	/** Closes and keeps the draft. */
	Cancel: FeedbackCancel,
	/** Sends the trimmed draft; waits on a promise; never closes. */
	Submit: FeedbackSubmit,
	displayName: "DelacourUI.Feedback",
});
