import { Field } from "@delacour/native-ui/field";
import { INPUT_SIZES, Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Size drives the box height, the value's type scale and a decorator's icon together.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_SIZES.map((size) => (
				<Field key={size}>
					<Field.Label>{size}</Field.Label>
					<Input placeholder={`Size ${size}`} size={size} />
				</Field>
			))}
		</View>
	);
}
