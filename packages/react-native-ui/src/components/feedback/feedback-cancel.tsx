import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useFeedbackPart } from "./feedback.context";

export type FeedbackCancelProps = ButtonProps;

/**
 * Closes the dialog and keeps the draft — a `secondary` `Button` labelled
 * "Cancel" unless given children. Clearing on cancel would throw away a long
 * message the user only meant to put down for a moment.
 *
 * @example
 * <Feedback.Cancel />
 */
export function FeedbackCancel({
	variant = "secondary",
	children = "Cancel",
	onPress,
	...props
}: FeedbackCancelProps): ReactElement {
	const { close } = useFeedbackPart("Feedback.Cancel");

	const handlePress = useCallback(() => {
		close();
		onPress?.();
	}, [close, onPress]);

	return (
		<Button onPress={handlePress} variant={variant} {...props}>
			{children}
		</Button>
	);
}
FeedbackCancel.displayName = "DelacourUI.Feedback.Cancel";
