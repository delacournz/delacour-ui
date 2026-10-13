import { NumberInput } from "@delacour/react-native-ui/number-input";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom anatomy",
	caption:
		"Pass the parts yourself to rearrange them. `position` tells a stepper which side its separator faces when both sit at the end.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			<Text.Caption color="muted">Both steppers at the end</Text.Caption>
			<NumberInput accessibilityLabel="Copies" defaultValue={1} min={1}>
				<NumberInput.Field className="text-left" />
				<NumberInput.Decrement position="end" />
				<NumberInput.Increment />
			</NumberInput>
		</View>
	);
}
