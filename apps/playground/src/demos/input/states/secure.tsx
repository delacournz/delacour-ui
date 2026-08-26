import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Secure",
	caption: "`secureTextEntry` is a `TextInput` prop, passed through untouched.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Password</Field.Label>
			<Input autoCapitalize="none" defaultValue="hunter2" secureTextEntry textContentType="password" />
		</Field>
	);
}
