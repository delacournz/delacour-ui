import {
	QUESTIONNAIRE_PROGRESS_VARIANTS,
	type Question,
	Questionnaire,
	type QuestionnaireProgressVariant,
} from "@delacour/react-native-ui/questionnaire";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Progress variants",
	caption:
		"`Questionnaire.Progress` draws a bar, a stepper or a plain count. All three read “Question 2 of 4” to a screen reader, and all three count only the questions currently visible.",
	capture: { align: "stretch" },
};

const QUESTIONS: readonly Question[] = [
	{ id: "name", kind: "text", placeholder: "Ada", title: "What should we call you?" },
	{ id: "again", kind: "yesNo", title: "Have you used a design system before?" },
	{ id: "stars", kind: "rating", title: "Rate your last one" },
	{ id: "notes", isMultiline: true, kind: "text", title: "Anything else?" },
];

const TITLES: Record<QuestionnaireProgressVariant, string> = {
	bar: "Bar",
	count: "Count",
	steps: "Steps",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{QUESTIONNAIRE_PROGRESS_VARIANTS.map((variant) => (
				<Questionnaire defaultCurrentId="again" isFramed={false} key={variant} questions={QUESTIONS} size="sm">
					<Questionnaire.Title>{TITLES[variant]}</Questionnaire.Title>
					<Questionnaire.Progress variant={variant} />
				</Questionnaire>
			))}
		</View>
	);
}
