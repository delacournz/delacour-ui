import { Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Trailing indicator, as a settings row",
	note: "The text sits inside the radio, so the whole row is one tap target — tapping the description selects the option. Writing the indicator last is all it takes; the row spreads on its own, with no flex-1 spacer.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [row, setRow] = useState("standard");

	return (
		<Radio.Group accessibilityLabel="Delivery speed" onSelected={setRow} selected={row}>
			<Radio testID="radio-standard" value="standard">
				<View className="min-w-0 shrink gap-0.5">
					<Radio.Label>Standard delivery</Radio.Label>
					<Text.Caption>Arrives in three to five days.</Text.Caption>
				</View>
				<Radio.Indicator />
			</Radio>
			<Radio testID="radio-express" value="express">
				<View className="min-w-0 shrink gap-0.5">
					<Radio.Label>Express delivery</Radio.Label>
					<Text.Caption>Arrives tomorrow.</Text.Caption>
				</View>
				<Radio.Indicator />
			</Radio>
		</Radio.Group>
	);
}
