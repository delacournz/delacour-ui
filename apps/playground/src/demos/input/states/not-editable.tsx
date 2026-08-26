import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Not editable",
	caption:
		"`isDisabled` fades the field and blocks it; `editable={false}` blocks it at full contrast, for a value that is shown rather than withheld.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Disabled</Field.Label>
				<Input defaultValue="Cannot be edited" isDisabled />
			</Field>
			<Field>
				<Field.Label>Read-only</Field.Label>
				<Input defaultValue="INV-2026-0041" editable={false} />
			</Field>
		</View>
	);
}
