import { STEPS_SIZES, Steps, type StepsSize } from "@delacour/react-native-ui/steps";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "One axis moves the circle, the number, the glyph, the title and the gaps together.",
	capture: { align: "stretch" },
};

const LABELS: Record<StepsSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{STEPS_SIZES.map((size) => (
				<View className="gap-3" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Steps defaultValue={1} size={size}>
						<Steps.Item step={0} testID={`steps-${size}-0`}>
							Plan
						</Steps.Item>
						<Steps.Item step={1} testID={`steps-${size}-1`}>
							Build
						</Steps.Item>
						<Steps.Item step={2} testID={`steps-${size}-2`}>
							Ship
						</Steps.Item>
					</Steps>
				</View>
			))}
		</View>
	);
}
