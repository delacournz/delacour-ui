import type { ReactElement } from "react";
import { Dialog, type DialogCloseProps } from "../dialog";
import { feedbackVariants } from "./feedback.variants";

export type FeedbackCloseProps = DialogCloseProps;

/**
 * The ✕ in the well's top-right corner — `Dialog.Close`, positioned against
 * the panel rather than the shell. `Feedback.Title`'s `pr-8` reserves its
 * clearance. Labelled `"Close"`; the draft is kept.
 *
 * With `asChild` it donates the close to its child, as `Dialog.Close` does.
 *
 * @example
 * <Feedback.Close />
 */
export function FeedbackClose(props: FeedbackCloseProps): ReactElement {
	if (props.asChild) return <Dialog.Close {...props} />;
	return <Dialog.Close {...props} className={feedbackVariants().close({ className: props.className })} />;
}
FeedbackClose.displayName = "DelacourUI.Feedback.Close";
