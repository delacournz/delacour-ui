import { TEXT_WEIGHTS, Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Weight",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof TEXT_WEIGHTS)[number], string> = {
	normal: "Normal",
	medium: "Medium",
	semibold: "Semibold",
	bold: "Bold",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_WEIGHTS.map((weight) => (
				<Text key={weight} weight={weight}>
					{LABELS[weight]}
				</Text>
			))}
		</View>
	);
}
