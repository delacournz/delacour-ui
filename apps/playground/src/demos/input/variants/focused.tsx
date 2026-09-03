import { Field } from "delacour-react-native-ui/field";
import { INPUT_VARIANTS, Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Focused",
	caption: "Tap a field. The border moves to the ring token and returns on blur.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_VARIANTS.map((variant) => (
				<Field key={variant}>
					<Field.Label>{variant}</Field.Label>
					<Input placeholder="Tap me" testID={`focus-${variant}`} variant={variant} />
				</Field>
			))}
		</View>
	);
}
