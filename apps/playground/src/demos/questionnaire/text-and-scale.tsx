import { type Question, Questionnaire } from "@delacour/react-native-ui/questionnaire";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Text and scale",
	caption:
		"A 0–10 scale is a wrapping row of numbered toggles with captions at each end — each read as “7 out of 10”. A multiline text question grows with its answer and counts against `maxLength`.",
	keyboardAware: true,
};

const QUESTIONS: readonly Question[] = [
	{
		id: "recommend",
		isRequired: true,
		kind: "scale",
		max: 10,
		maxLabel: "Extremely likely",
		min: 0,
		minLabel: "Not at all",
		title: "How likely are you to recommend us to a friend?",
	},
	{
		id: "why",
		isMultiline: true,
		kind: "text",
		maxLength: 280,
		placeholder: "What is the main reason for your score?",
		title: "Tell us why",
	},
];

export function Demo(): ReactElement {
	return (
		<Questionnaire defaultAnswers={{ recommend: { kind: "scale", value: 8 } }} questions={QUESTIONS}>
			<Questionnaire.Title>Quick feedback</Questionnaire.Title>
			<Questionnaire.Question />
			<Questionnaire.Footer />
		</Questionnaire>
	);
}
