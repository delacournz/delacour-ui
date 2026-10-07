import type { ReactElement } from "react";
import { Button, type ButtonProps } from "../button";

export type FeedbackActionProps = ButtonProps;

/**
 * A custom footer action — "Skip", "Back", "Attach screenshot" — as a
 * `secondary` `Button`. Pass `variant` to change it.
 *
 * @example
 * <Feedback.Action onPress={back}>Back</Feedback.Action>
 */
export function FeedbackAction({ variant = "secondary", ...props }: FeedbackActionProps): ReactElement {
	return <Button variant={variant} {...props} />;
}
FeedbackAction.displayName = "DelacourUI.Feedback.Action";
