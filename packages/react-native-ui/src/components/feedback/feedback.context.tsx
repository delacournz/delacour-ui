import { createContext, type ReactElement, type ReactNode, use } from "react";

export type FeedbackContextValue = {
	/** The draft as typed — untrimmed. */
	value: string;
	/** Replaces the draft. Reports through `onValueChange`. */
	setValue: (value: string) => void;
	/** Whether the dialog is open. */
	isOpen: boolean;
	/** Closes the dialog. The draft is kept. */
	close: () => void;
	/** Empties the draft — after a successful send, say. */
	clear: () => void;
};

/** What the parts share that a caller has no use for. */
export type FeedbackInternalValue = FeedbackContextValue & {
	/** Whether a promise `onSubmit` returned is still in flight. */
	isSending: boolean;
	setSending: (isSending: boolean) => void;
	/** The title's text when it is a plain string — the field's default label. */
	titleText: string | undefined;
	setTitleText: (text: string | undefined) => void;
};

const FeedbackContext = createContext<FeedbackInternalValue | null>(null);

/**
 * Supplies the feedback dialog's draft and send state to its parts.
 *
 * Its own module, importing nothing but React, so a part can read it without
 * importing `./feedback` — that import would close a cycle, and Metro serves a
 * partially initialised module for one.
 */
export function FeedbackProvider({
	value,
	children,
}: {
	value: FeedbackInternalValue;
	children: ReactNode;
}): ReactElement {
	return <FeedbackContext value={value}>{children}</FeedbackContext>;
}
FeedbackProvider.displayName = "DelacourUI.Feedback.Provider";

/** The enclosing feedback dialog's context, or null outside a `<Feedback>`. */
export function useFeedbackContext(): FeedbackContextValue | null {
	return use(FeedbackContext);
}

/**
 * Reads the enclosing feedback dialog's draft, its setters and its open state.
 *
 * Lets a custom child — a row of chips, a rating step — read or replace the
 * draft, and lets an `onSubmit` close and clear once the send has gone through.
 * Throws outside a `<Feedback>`.
 */
export function useFeedback(): FeedbackContextValue {
	const context = use(FeedbackContext);
	if (!context) {
		throw new Error("useFeedback must be called inside a <Feedback>.");
	}
	return context;
}

/** The full context, for a part that cannot work without one. Internal. */
export function useFeedbackPart(component: string): FeedbackInternalValue {
	const context = use(FeedbackContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Feedback>.`);
	}
	return context;
}
