import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { feedbackVariants } from "./feedback.variants";

export type FeedbackFooterProps = ViewProps & { className?: string };

/**
 * The actions, on the band under the well — an end-aligned row, inset less
 * than the well so the buttons line up with the shell's edge rather than the
 * well's text.
 *
 * @example
 * <Feedback.Footer>
 *   <Feedback.Cancel />
 *   <Feedback.Submit onSubmit={send} />
 * </Feedback.Footer>
 */
export function FeedbackFooter({ className, ...props }: FeedbackFooterProps): ReactElement {
	return <View className={feedbackVariants().footer({ className })} {...props} />;
}
FeedbackFooter.displayName = "DelacourUI.Feedback.Footer";
