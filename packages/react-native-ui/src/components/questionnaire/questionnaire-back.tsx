import { type ReactElement, useCallback } from "react";
import { Button } from "../button";
import { useQuestionnairePart } from "./questionnaire.context";
import type { QuestionnaireButtonProps } from "./questionnaire.types";
import { resolveQuestionnaireFooterButtons, resolveQuestionnaireTestId } from "./questionnaire.variants";

/**
 * Returns to the question actually visited before — across a branch, not to
 * the previous index. Never validates. Renders nothing on the first question.
 */
export function QuestionnaireBack({ children, onPress, ...props }: QuestionnaireButtonProps): ReactElement | null {
	const questionnaire = useQuestionnairePart("Questionnaire.Back");
	const { axes, testID, back, isDisabled, isSubmitting } = questionnaire;
	const shown = resolveQuestionnaireFooterButtons({
		canBack: questionnaire.canBack,
		canSkip: questionnaire.canSkip,
		isLast: questionnaire.isLast,
		isSubmitted: questionnaire.isSubmitted,
	}).back;

	const handlePress = useCallback(() => {
		back();
		onPress?.();
	}, [back, onPress]);

	if (!shown) return null;

	return (
		<Button
			isDisabled={isDisabled || isSubmitting}
			onPress={handlePress}
			size={axes.buttonSize}
			testID={resolveQuestionnaireTestId(testID, "back")}
			variant={axes.backVariant}
			{...props}
		>
			{children ?? "Back"}
		</Button>
	);
}
QuestionnaireBack.displayName = "DelacourUI.Questionnaire.Back";
