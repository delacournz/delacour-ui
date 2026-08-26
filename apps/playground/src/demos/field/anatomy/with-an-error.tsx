import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With an error",
	caption:
		"`Field.Error` renders nothing when it has no children, so `<Field.Error>{error}</Field.Error>` disappears on its own once the value is fixed.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field isInvalid>
				<Field.Label>Email</Field.Label>
				<Input defaultValue="not-an-email" inputMode="email" />
				<Field.Error>Enter a valid email address.</Field.Error>
			</Field>
			<Field>
				<Field.Label>Email</Field.Label>
				<Input defaultValue="ada@example.com" inputMode="email" />
				<Field.Error>{undefined}</Field.Error>
			</Field>
		</View>
	);
}
