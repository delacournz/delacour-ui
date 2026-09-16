import { Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Per-option description",
	note: "There is no Radio.Description. The caption is composed inside the row, so it stays within the one tap target and inside the accessible name.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [speed, setSpeed] = useState("standard");

	return (
		<Radio.Group accessibilityLabel="Delivery" onSelected={setSpeed} selected={speed}>
			<Radio testID="radio-standard" value="standard">
				<View className="min-w-0 shrink gap-0.5">
					<Radio.Label>Standard</Radio.Label>
					<Text.Caption>Arrives in three to five days.</Text.Caption>
				</View>
			</Radio>
			<Radio testID="radio-express" value="express">
				<View className="min-w-0 shrink gap-0.5">
					<Radio.Label>Express</Radio.Label>
					<Text.Caption>Arrives tomorrow.</Text.Caption>
				</View>
			</Radio>
		</Radio.Group>
	);
}
