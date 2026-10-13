import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Separator } from "../separator";
import { useQuestionnairePart } from "./questionnaire.context";
import { questionnaireVariants } from "./questionnaire.variants";
import { QuestionnaireBack } from "./questionnaire-back";
import { QuestionnaireNext } from "./questionnaire-next";
import { QuestionnaireSkip } from "./questionnaire-skip";
import { QuestionnaireSpacer } from "./questionnaire-spacer";
import { QuestionnaireSubmit } from "./questionnaire-submit";

export type QuestionnaireFooterProps = ViewProps & { className?: string; children?: ReactNode };

/**
 * The row of navigation buttons. Framed, it is a band under a rule that runs
 * to the card's edges.
 *
 * With no children it lays out Back, a spacer, Skip, Next and Submit — each
 * hides itself where it does not apply. Once submitted it renders nothing.
 */
export function QuestionnaireFooter({ className, children, ...props }: QuestionnaireFooterProps): ReactElement | null {
	const { isFramed, isSubmitted, size } = useQuestionnairePart("Questionnaire.Footer");
	if (isSubmitted) return null;

	const content = children ?? (
		<>
			<QuestionnaireBack />
			<QuestionnaireSpacer />
			<QuestionnaireSkip />
			<QuestionnaireNext />
			<QuestionnaireSubmit />
		</>
	);

	const row = (
		<View className={questionnaireVariants({ isFramed, size }).footer({ className })} {...props}>
			{content}
		</View>
	);

	if (!isFramed) return row;

	return (
		<>
			<Separator />
			{row}
		</>
	);
}
QuestionnaireFooter.displayName = "DelacourUI.Questionnaire.Footer";
