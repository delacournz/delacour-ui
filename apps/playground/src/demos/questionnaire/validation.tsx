import { type Question, Questionnaire, type ValidationError } from "@delacour/react-native-ui/questionnaire";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Validation",
	caption:
		"Next is dimmed but never disabled: press it with nothing chosen and the error appears under the control, is read aloud, and buzzes once. `getErrorMessage` rewords any error — here, the selection limits.",
};

const QUESTIONS: readonly Question[] = [
	{
		id: "toppings",
		isRequired: true,
		kind: "multiple",
		maxSelected: 2,
		minSelected: 1,
		options: [
			{ label: "Mushroom", value: "mushroom" },
			{ label: "Olive", value: "olive" },
			{ label: "Pineapple", value: "pineapple" },
			{ description: "Out of stock today", isDisabled: true, label: "Anchovy", value: "anchovy" },
		],
		title: "Pick your toppings",
	},
	{
		id: "name",
		isRequired: true,
		kind: "text",
		minLength: 2,
		placeholder: "Name for the order",
		title: "Who is it for?",
	},
];

function errorMessage(error: ValidationError): string {
	switch (error.type) {
		case "required":
			return "We need an answer to carry on.";
		case "minSelected":
			return `Pick at least ${error.min}.`;
		case "maxSelected":
			return `Two toppings at most — untick one to carry on.`;
		case "minLength":
			return `At least ${error.min} letters, please.`;
		default:
			return "That answer does not fit.";
	}
}

export function Demo(): ReactElement {
	return <Questionnaire getErrorMessage={errorMessage} questions={QUESTIONS} variant="secondary" />;
}
