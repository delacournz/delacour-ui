import { type ReactElement, useCallback } from "react";
import { Button } from "../button";
import { useQuestionnairePart } from "./questionnaire.context";
import type { QuestionnaireButtonProps } from "./questionnaire.types";
import { questionnaireVariants, resolveQuestionnaireFooterButtons } from "./questionnaire.variants";

/**
 * Validates every visible question and calls `onSubmit`.
 *
 * Renders only on the last visible question. A failure moves to the first
 * invalid question and shows its error. While a promise from `onSubmit` is
 * pending it shows a spinner and the whole form is inert.
 */
export function QuestionnaireSubmit({
	children,
	className,
	onPress,
	...props
}: QuestionnaireButtonProps): ReactElement | null {
	const questionnaire = useQuestionnairePart("Questionnaire.Submit");
	const { axes, submit, isCurrentValid, isDisabled, isReadOnly, isSubmitting } = questionnaire;
	const shown = resolveQuestionnaireFooterButtons({
		canBack: questionnaire.canBack,
		canSkip: questionnaire.canSkip,
		isLast: questionnaire.isLast,
		isSubmitted: questionnaire.isSubmitted,
	}).submit;

	const handlePress = useCallback(() => {
		submit();
		onPress?.();
	}, [submit, onPress]);

	if (!shown || isReadOnly) return null;

	return (
		<Button
			accessibilityHint={isCurrentValid ? undefined : "Answer required"}
			accessibilityState={{ busy: isSubmitting, disabled: isDisabled }}
			className={questionnaireVariants({ isDimmed: !isCurrentValid }).action({ className })}
			isDisabled={isDisabled}
			isLoading={isSubmitting}
			onPress={handlePress}
			size={axes.buttonSize}
			variant={axes.nextVariant}
			{...props}
		>
			{children ?? "Submit"}
		</Button>
	);
}
QuestionnaireSubmit.displayName = "DelacourUI.Questionnaire.Submit";
