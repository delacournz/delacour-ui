import { type Answers, type Question, Questionnaire } from "@delacour/react-native-ui/questionnaire";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Three questions — one choice, several choices, a rating — and `onSubmit`. With no children the questionnaire lays out its progress bar, the question and a footer whose buttons hide where they do not apply.",
	capture: { align: "stretch", flow: "questionnaire/basic", hero: true },
};

const QUESTIONS: readonly Question[] = [
	{
		id: "role",
		isRequired: true,
		kind: "single",
		options: [
			{ label: "Designer", value: "design" },
			{ label: "Engineer", value: "engineering" },
			{ label: "Product manager", value: "product" },
			{ isOther: true, label: "Something else", value: "other" },
		],
		title: "What best describes your role?",
	},
	{
		description: "Choose up to three.",
		id: "tools",
		kind: "multiple",
		maxSelected: 3,
		options: [
			{ label: "Figma", value: "figma" },
			{ label: "Xcode", value: "xcode" },
			{ label: "Android Studio", value: "android-studio" },
			{ label: "VS Code", value: "vs-code" },
		],
		title: "Which tools do you use every week?",
	},
	{ id: "satisfaction", isRequired: true, kind: "rating", title: "How happy are you with the library?" },
];

export function Demo(): ReactElement {
	const [submitted, setSubmitted] = useState<Answers | null>(null);

	return (
		<View className="gap-4">
			<Questionnaire
				defaultAnswers={{ role: { kind: "single", value: "design" } }}
				onSubmit={setSubmitted}
				questions={QUESTIONS}
				testID="survey"
			/>
			{submitted ? <Text.Code testID="questionnaire-submitted">{JSON.stringify(submitted, null, 2)}</Text.Code> : null}
		</View>
	);
}
