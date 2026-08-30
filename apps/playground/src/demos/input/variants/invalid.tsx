import { Field } from "@delacour/native-ui/field";
import { INPUT_VARIANTS, Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Invalid",
	caption:
		"The border, the caret and the selection highlight all turn destructive. Tap one — invalid outranks focus, so it stays destructive while the value is being fixed.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_VARIANTS.map((variant) => (
				<Field key={variant}>
					<Field.Label>{variant}</Field.Label>
					<Input defaultValue="not-an-email" isInvalid testID={`invalid-${variant}`} variant={variant} />
				</Field>
			))}
		</View>
	);
}
