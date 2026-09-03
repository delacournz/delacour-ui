import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "All four",
	capture: { align: "stretch", hero: true },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field isInvalid>
			<Field.Label>Password</Field.Label>
			<Input defaultValue="hunter2" secureTextEntry />
			<Field.Description>At least twelve characters.</Field.Description>
			<Field.Error>That password is too short.</Field.Error>
		</Field>
	);
}
