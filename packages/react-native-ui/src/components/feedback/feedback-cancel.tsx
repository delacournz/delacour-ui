import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useFeedbackPart } from "./feedback.context";

export type FeedbackCancelProps = ButtonProps;

/**
 * Closes the dialog and keeps the draft — a `secondary` `Button` labelled
 * `labels.cancel` ("Cancel") unless given children. Clearing on cancel would throw away a long
 * message the user only meant to put down for a moment.
 *
 * @example
 * <Feedback.Cancel />
 */
export function FeedbackCancel({
	variant = "secondary",
	children,
	onPress,
	...props
}: FeedbackCancelProps): ReactElement {
	const { close, labels } = useFeedbackPart("Feedback.Cancel");

	const handlePress = useCallback(() => {
		close();
		onPress?.();
	}, [close, onPress]);

	return (
		<Button onPress={handlePress} variant={variant} {...props}>
			{children ?? labels.cancel}
		</Button>
	);
}
FeedbackCancel.displayName = "DelacourUI.Feedback.Cancel";
