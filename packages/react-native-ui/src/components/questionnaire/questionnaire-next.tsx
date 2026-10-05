import { type ReactElement, useCallback } from "react";
import { Button } from "../button";
import { useQuestionnairePart } from "./questionnaire.context";
import type { QuestionnaireButtonProps } from "./questionnaire.types";
import {
	questionnaireVariants,
	resolveQuestionnaireFooterButtons,
	resolveQuestionnaireTestId,
} from "./questionnaire.variants";

/**
 * Validates the current question and moves to the next visible one.
 *
 * While the answer would not pass it is dimmed but still pressable — a press
 * shows the error, announces it and buzzes once — so it reports
 * `disabled: false` with an "Answer required" hint rather than going inert.
 * Renders nothing on the last question, where Submit takes its place.
 */
export function QuestionnaireNext({
	children,
	className,
	onPress,
	...props
}: QuestionnaireButtonProps): ReactElement | null {
	const questionnaire = useQuestionnairePart("Questionnaire.Next");
	const { axes, testID, next, isCurrentValid, isDisabled, isSubmitting } = questionnaire;
	const shown = resolveQuestionnaireFooterButtons({
		canBack: questionnaire.canBack,
		canSkip: questionnaire.canSkip,
		isLast: questionnaire.isLast,
		isSubmitted: questionnaire.isSubmitted,
	}).next;

	const handlePress = useCallback(() => {
		next();
		onPress?.();
	}, [next, onPress]);

	if (!shown) return null;

	return (
		<Button
			accessibilityHint={isCurrentValid ? undefined : "Answer required"}
			accessibilityState={{ disabled: isDisabled }}
			className={questionnaireVariants({ isDimmed: !isCurrentValid }).action({ className })}
			isDisabled={isDisabled || isSubmitting}
			onPress={handlePress}
			size={axes.buttonSize}
			testID={resolveQuestionnaireTestId(testID, "next")}
			variant={axes.nextVariant}
			{...props}
		>
			{children ?? "Next"}
		</Button>
	);
}
QuestionnaireNext.displayName = "DelacourUI.Questionnaire.Next";
