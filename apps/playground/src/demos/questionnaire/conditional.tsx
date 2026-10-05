import { type Question, Questionnaire } from "@delacour/react-native-ui/questionnaire";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Conditional questions",
	caption:
		"Answer “No” and the follow-up disappears: the count drops, Next skips past it, its stale answer is dropped, and Back from the last question returns to the one you actually saw.",
	keyboardAware: true,
};

const QUESTIONS: readonly Question[] = [
	{ id: "pets", isRequired: true, kind: "yesNo", title: "Do you have any pets?" },
	{
		id: "which",
		kind: "multiple",
		options: [
			{ label: "Dog", value: "dog" },
			{ label: "Cat", value: "cat" },
			{ label: "Fish", value: "fish" },
			{ isOther: true, label: "Other", value: "other" },
		],
		showIf: { questionId: "pets", type: "equals", value: "yes" },
		title: "Which ones?",
	},
	{
		id: "walks",
		kind: "scale",
		max: 5,
		maxLabel: "Every day",
		min: 0,
		minLabel: "Never",
		showIf: { questionId: "which", type: "includes", value: "dog" },
		title: "How many walks a week?",
	},
	{ id: "postcode", kind: "text", placeholder: "6011", title: "Your postcode" },
];

export function Demo(): ReactElement {
	return (
		<Questionnaire defaultAnswers={{ pets: { kind: "yesNo", value: "yes" } }} questions={QUESTIONS}>
			<Questionnaire.Progress variant="count" />
			<Questionnaire.Question />
			<Questionnaire.Footer />
		</Questionnaire>
	);
}
