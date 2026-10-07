import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useFeedbackPart } from "./feedback.context";
import { canSubmitFeedback } from "./feedback.variants";

export type FeedbackSubmitProps = Omit<ButtonProps, "onPress"> & {
	/** Receives the trimmed message. Does NOT close — sending has to finish first. */
	onSubmit: (value: string) => void | Promise<void>;
	/** Allow submitting an empty message (e.g. when chips were picked). Default false. */
	canSubmitEmpty?: boolean;
};

/** Whether a value is a promise, without trusting `instanceof` across realms. */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return typeof value === "object" && value !== null && typeof (value as PromiseLike<unknown>).then === "function";
}

/**
 * Sends the message — a primary `Button` labelled "Send" unless given children.
 *
 * Disabled while `canSubmitFeedback` says no: an empty or whitespace draft,
 * unless `canSubmitEmpty`. `onSubmit` receives the trimmed text.
 *
 * **It never closes the dialog.** When `onSubmit` returns a promise the button
 * shows its loading state and the field turns read-only until the promise
 * settles, and then the dialog is still open — so a failure can be shown in
 * the well with the draft intact. Close and clear from `onSubmit` on success,
 * through `useFeedback()` or controlled state. Handle a failure inside
 * `onSubmit`: a rejection is not caught here, so it still reaches the app's
 * unhandled-rejection reporting rather than vanishing.
 *
 * @example
 * <Feedback.Submit
 *   onSubmit={async (message) => {
 *     await send(message);
 *     clear();
 *     close();
 *   }}
 * />
 */
export function FeedbackSubmit({
	onSubmit,
	canSubmitEmpty = false,
	isDisabled = false,
	isLoading = false,
	children = "Send",
	...props
}: FeedbackSubmitProps): ReactElement {
	const { value, isSending, setSending } = useFeedbackPart("Feedback.Submit");
	const canSubmit = canSubmitFeedback({ canSubmitEmpty, isDisabled, value });

	const handlePress = useCallback(() => {
		if (!canSubmit || isSending) return;
		const result = onSubmit(value.trim());
		if (!isPromiseLike(result)) return;

		setSending(true);
		const settle = () => setSending(false);
		void Promise.resolve(result).finally(settle);
	}, [canSubmit, isSending, onSubmit, setSending, value]);

	return (
		<Button
			isDisabled={!canSubmit}
			isLoading={isLoading || isSending}
			onPress={handlePress}
			variant="primary"
			{...props}
		>
			{children}
		</Button>
	);
}
FeedbackSubmit.displayName = "DelacourUI.Feedback.Submit";
