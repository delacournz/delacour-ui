import type { ReactElement } from "react";
import { Dialog, type DialogTriggerProps } from "../dialog";

export type FeedbackTriggerProps = DialogTriggerProps;

/**
 * The control that opens the feedback dialog — `Dialog.Trigger`, unchanged.
 *
 * `asChild` donates the open to a `Button` rather than wrapping it, for the
 * reason `Dialog.Trigger` gives: two tap gestures nested are not simultaneous.
 *
 * @example
 * <Feedback.Trigger asChild>
 *   <Button variant="secondary">Give feedback</Button>
 * </Feedback.Trigger>
 */
export function FeedbackTrigger(props: FeedbackTriggerProps): ReactElement {
	return <Dialog.Trigger {...props} />;
}
FeedbackTrigger.displayName = "DelacourUI.Feedback.Trigger";
