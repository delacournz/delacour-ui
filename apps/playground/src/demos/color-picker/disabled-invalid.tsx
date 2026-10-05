import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Field } from "@delacour/react-native-ui/field";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled, read-only and invalid",
	note: "Disabled and invalid cascade from a Field. Read-only draws the colour normally and ignores every drag, tap and keystroke.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<Field isDisabled>
				<Field.Label>Disabled</Field.Label>
				<ColorPicker defaultValue="#22c55e" presentation="sheet" />
			</Field>
			<Field>
				<Field.Label>Read-only</Field.Label>
				<ColorPicker defaultValue="#3b82f6" isReadOnly size="sm" />
			</Field>
			<Field isInvalid>
				<Field.Label>Invalid</Field.Label>
				<ColorPicker defaultValue="#ef4444" presentation="sheet" />
				<Field.Error>Pick a colour with more contrast.</Field.Error>
			</Field>
		</View>
	);
}
