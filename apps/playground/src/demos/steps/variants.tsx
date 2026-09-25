import { STEPS_VARIANTS, Steps, type StepsVariant } from "@delacour/react-native-ui/steps";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`primary` rings the current step and leaves the steps ahead hollow. `secondary` fills every indicator — completed soft, current solid, upcoming muted.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<StepsVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{STEPS_VARIANTS.map((variant) => (
				<View className="gap-3" key={variant}>
					<Text.Caption color="muted">{LABELS[variant]}</Text.Caption>
					<Steps defaultValue={1} variant={variant}>
						<Steps.Item step={0} testID={`steps-${variant}-0`}>
							Cart
						</Steps.Item>
						<Steps.Item step={1} testID={`steps-${variant}-1`}>
							Details
						</Steps.Item>
						<Steps.Item step={2} testID={`steps-${variant}-2`}>
							Review
						</Steps.Item>
					</Steps>
				</View>
			))}
		</View>
	);
}
