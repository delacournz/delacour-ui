import { SEPARATOR_ORIENTATIONS } from "@delacour/native-ui/separator";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Orientation tokens",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			{SEPARATOR_ORIENTATIONS.map((orientation) => (
				<View className="rounded-lg bg-tertiary px-3 py-2" key={orientation}>
					<Text className="text-sm text-tertiary-foreground">{orientation}</Text>
				</View>
			))}
		</View>
	);
}
