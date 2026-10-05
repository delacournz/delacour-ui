import { type ReactElement, useEffect } from "react";
import { Dialog, type DialogTitleProps } from "../dialog";
import { useFeedbackPart } from "./feedback.context";
import { feedbackVariants } from "./feedback.variants";

export type FeedbackTitleProps = DialogTitleProps;

/**
 * The question the dialog asks — a `Dialog.Title`, inside the well.
 *
 * It is what the dialog is labelled by and where accessibility focus lands on
 * open, exactly as in a `Dialog`. When its children are a plain string, that
 * string also becomes `Feedback.Field`'s default `accessibilityLabel`, so the
 * field announces the question rather than only its placeholder.
 *
 * @example
 * <Feedback.Title>What should we fix first?</Feedback.Title>
 */
export function FeedbackTitle({ className, children, ...props }: FeedbackTitleProps): ReactElement {
	const { setTitleText } = useFeedbackPart("Feedback.Title");
	const text = typeof children === "string" ? children : undefined;

	useEffect(() => {
		setTitleText(text);
		return () => setTitleText(undefined);
	}, [setTitleText, text]);

	return (
		<Dialog.Title className={feedbackVariants().title({ className })} {...props}>
			{children}
		</Dialog.Title>
	);
}
FeedbackTitle.displayName = "DelacourUI.Feedback.Title";
