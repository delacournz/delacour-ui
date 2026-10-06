import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Text, type TextPresetProps } from "../text";
import { useQuestionnairePart } from "./questionnaire.context";
import { questionnaireVariants } from "./questionnaire.variants";

export type QuestionnaireTitleProps = TextPresetProps;

/**
 * The questionnaire's name, at the top of the header strip.
 *
 * Its preset steps with the questionnaire's `size` — a section heading at
 * `sm` and `md`, a title at `lg` — and it is announced as a heading.
 */
export function QuestionnaireTitle({ className, ...props }: QuestionnaireTitleProps): ReactElement {
	const { axes, isFramed, size } = useQuestionnairePart("Questionnaire.Title");
	const slots = questionnaireVariants({ isFramed, size });
	const TitleText = axes.titleVariant === "title" ? Text.Title : Text.Header;
	return <TitleText className={slots.header({ className: cn(slots.title(), className) })} {...props} />;
}
QuestionnaireTitle.displayName = "DelacourUI.Questionnaire.Title";
