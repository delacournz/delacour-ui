import { TEXT_WEIGHTS, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Weight",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_WEIGHTS.map((weight) => (
				<Text key={weight} weight={weight}>
					weight {weight}
				</Text>
			))}
		</View>
	);
}
