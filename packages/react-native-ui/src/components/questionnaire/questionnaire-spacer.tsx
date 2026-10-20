import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useQuestionnairePart } from "./questionnaire.context";
import { questionnaireVariants } from "./questionnaire.variants";

export type QuestionnaireSpacerProps = ViewProps & { className?: string };

/** Fills the footer row, pushing what follows it to the trailing edge. */
export function QuestionnaireSpacer({ className, ...props }: QuestionnaireSpacerProps): ReactElement {
	useQuestionnairePart("Questionnaire.Spacer");
	return <View className={questionnaireVariants().spacer({ className })} {...props} />;
}
QuestionnaireSpacer.displayName = "DelacourUI.Questionnaire.Spacer";
