import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Invalid wins by default, and loses to a caller",
	caption:
		"An invalid field turns its caret danger without being told. Passing a class still overrides it — the default is a default, not a rule.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Invalid, untouched</Field.Label>
				<Input defaultValue="Select this text" isInvalid />
			</Field>
			<Field>
				<Field.Label>Invalid, overridden</Field.Label>
				<Input defaultValue="Select this text" isInvalid selectionColorClassName="accent-info" />
			</Field>
		</View>
	);
}
