import { TEXT_SIZES, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Size",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_SIZES.map((size) => (
				<Text key={size} size={size}>
					size {size}
				</Text>
			))}
		</View>
	);
}
