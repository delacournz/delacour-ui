import { Button } from "@delacour/react-native-ui/button";
import { type Answers, type Question, Questionnaire } from "@delacour/react-native-ui/questionnaire";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`answers` and `currentId` held outside. The readout updates on every change, and the buttons below jump with `currentId` — visited questions and the next one, while `isLinear`.",
	keyboardAware: true,
};

const QUESTIONS: readonly Question[] = [
	{
		id: "colour",
		kind: "single",
		options: [
			{ label: "Amber", value: "amber" },
			{ label: "Zinc", value: "zinc" },
		],
		title: "Accent colour",
	},
	{ id: "dark", kind: "yesNo", noLabel: "Light", title: "Theme", yesLabel: "Dark" },
	{ id: "density", kind: "scale", max: 5, min: 1, title: "Density" },
];

export function Demo(): ReactElement {
	const [answers, setAnswers] = useState<Answers>({});
	const [currentId, setCurrentId] = useState<string | null>(null);

	return (
		<View className="gap-4">
			<Questionnaire
				answers={answers}
				currentId={currentId}
				isLinear={false}
				onAnswersChange={setAnswers}
				onCurrentChange={setCurrentId}
				questions={QUESTIONS}
			/>
			<View className="flex-row gap-2">
				{QUESTIONS.map((question) => (
					<Button
						key={question.id}
						onPress={() => setCurrentId(question.id)}
						size="sm"
						testID={`questionnaire-go-${question.id}`}
						variant="secondary"
					>
						{question.title}
					</Button>
				))}
			</View>
			<Text.Code testID="questionnaire-answers">{JSON.stringify(answers)}</Text.Code>
		</View>
	);
}
