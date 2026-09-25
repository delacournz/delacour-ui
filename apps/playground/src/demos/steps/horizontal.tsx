import { Button } from "@delacour/react-native-ui/button";
import { Steps } from "@delacour/react-native-ui/steps";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal",
	caption:
		"Titles sit under their indicators, and the line between two steps fills once the value has passed the first. Tap a step to jump there.",
	capture: { align: "stretch", flow: "steps/horizontal", hero: true },
};

const STEPS = ["Account", "Shipping", "Payment"] as const;

export function Demo(): ReactElement {
	const [step, setStep] = useState(1);

	return (
		<View className="gap-6">
			<Steps onValueChange={setStep} value={step}>
				{STEPS.map((title, index) => (
					<Steps.Item key={title} step={index} testID={`steps-horizontal-${index}`}>
						{title}
					</Steps.Item>
				))}
			</Steps>
			<View className="flex-row justify-between gap-3">
				<Button
					isDisabled={step === 0}
					onPress={() => setStep(step - 1)}
					size="sm"
					testID="steps-horizontal-back"
					variant="outline"
				>
					Back
				</Button>
				<Button
					isDisabled={step === STEPS.length}
					onPress={() => setStep(step + 1)}
					size="sm"
					testID="steps-horizontal-next"
				>
					{step >= STEPS.length - 1 ? "Finish" : "Next"}
				</Button>
			</View>
		</View>
	);
}
