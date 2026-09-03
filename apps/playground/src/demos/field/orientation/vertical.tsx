import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	caption: "The default. Label over control, which is what a text field almost always wants.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Display name</Field.Label>
			<Input placeholder="Ada" />
		</Field>
	);
}
