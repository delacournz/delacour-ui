import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "One flag, three things",
	caption:
		"The `Input` below names no props at all. The label turns destructive, the control turns destructive, and the description stays muted so the error is the one line that appeared.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field isInvalid>
			<Field.Label>Username</Field.Label>
			<Input defaultValue="ada" />
			<Field.Description>This is how other people will find you.</Field.Description>
			<Field.Error>That username is taken.</Field.Error>
		</Field>
	);
}
