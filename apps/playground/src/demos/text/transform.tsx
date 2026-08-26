import { TEXT_TRANSFORMS, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Transform",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_TRANSFORMS.map((transform) => (
				<Text key={transform} transform={transform}>
					transform {transform}
				</Text>
			))}
			<Text.Overline transform="none">an overline with its uppercase cleared</Text.Overline>
		</View>
	);
}
