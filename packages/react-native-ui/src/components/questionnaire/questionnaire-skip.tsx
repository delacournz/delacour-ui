import { type ReactElement, useCallback } from "react";
import { Button } from "../button";
import { useQuestionnairePart } from "./questionnaire.context";
import type { QuestionnaireButtonProps } from "./questionnaire.types";
import { resolveQuestionnaireFooterButtons, resolveQuestionnaireTestId } from "./questionnaire.variants";

/**
 * Records a deliberate omission and moves on. Renders only on an optional
 * question; on the last one it records the skip and leaves Submit to finish.
 */
export function QuestionnaireSkip({ children, onPress, ...props }: QuestionnaireButtonProps): ReactElement | null {
	const questionnaire = useQuestionnairePart("Questionnaire.Skip");
	const { axes, testID, skip, isDisabled, isReadOnly, isSubmitting } = questionnaire;
	const shown = resolveQuestionnaireFooterButtons({
		canBack: questionnaire.canBack,
		canSkip: questionnaire.canSkip,
		isLast: questionnaire.isLast,
		isSubmitted: questionnaire.isSubmitted,
	}).skip;

	const handlePress = useCallback(() => {
		skip();
		onPress?.();
	}, [skip, onPress]);

	if (!shown || isReadOnly) return null;

	return (
		<Button
			accessibilityLabel="Skip this question"
			isDisabled={isDisabled || isSubmitting}
			onPress={handlePress}
			size={axes.buttonSize}
			testID={resolveQuestionnaireTestId(testID, "skip")}
			variant={axes.skipVariant}
			{...props}
		>
			{children ?? "Skip"}
		</Button>
	);
}
QuestionnaireSkip.displayName = "DelacourUI.Questionnaire.Skip";
