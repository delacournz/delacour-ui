import { Button } from "@delacour/react-native-ui/button";
import { Steps } from "@delacour/react-native-ui/steps";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Linear",
	caption:
		"`isLinear` closes the steps ahead of the value — only Continue moves forward — while every step behind stays open for going back.",
};

const STEPS = ["Profile", "Team", "Billing", "Invite"] as const;

export function Demo(): ReactElement {
	const [step, setStep] = useState(0);

	return (
		<View className="gap-6">
			<Steps isLinear onValueChange={setStep} size="sm" value={step}>
				{STEPS.map((title, index) => (
					<Steps.Item key={title} step={index} testID={`steps-linear-${index}`}>
						{title}
					</Steps.Item>
				))}
			</Steps>
			<Text.Caption className="text-center" color="muted">
				{step < STEPS.length ? `Step ${step + 1} of ${STEPS.length}` : "All done"}
			</Text.Caption>
			<Button onPress={() => setStep(step >= STEPS.length ? 0 : step + 1)} size="sm" testID="steps-linear-continue">
				{step >= STEPS.length ? "Start again" : "Continue"}
			</Button>
		</View>
	);
}
