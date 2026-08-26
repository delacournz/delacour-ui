import { TEXT_ALIGNS, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Alignment",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2 rounded-lg border border-border p-3">
			{TEXT_ALIGNS.map((align) => (
				<Text align={align} className="w-full" key={align}>
					align {align}
				</Text>
			))}
		</View>
	);
}
