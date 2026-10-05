import type { ReactElement } from "react";
import { Dialog, type DialogContentProps } from "../dialog";
import { feedbackVariants } from "./feedback.variants";

export type FeedbackContentProps = DialogContentProps;

/**
 * The shell — a `Dialog.Content` on the muted band.
 *
 * Portal, scrim, motion, keyboard lift, back button, escape and focus are all
 * Dialog's. This only swaps the card's fill for `bg-muted` and tightens its
 * padding, so the `Feedback.Panel` inside reads as a well sunk into it and the
 * footer's actions sit on the band around it.
 *
 * @example
 * <Feedback.Content>
 *   <Feedback.Panel>…</Feedback.Panel>
 *   <Feedback.Footer>…</Feedback.Footer>
 * </Feedback.Content>
 */
export function FeedbackContent({ className, ...props }: FeedbackContentProps): ReactElement {
	return <Dialog.Content className={feedbackVariants().content({ className })} {...props} />;
}
FeedbackContent.displayName = "DelacourUI.Feedback.Content";
