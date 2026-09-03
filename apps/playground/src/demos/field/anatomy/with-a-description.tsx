import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With a description",
	caption: "`Field.Description` is `Text.Caption`, and stays muted in every state.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Username</Field.Label>
			<Input autoCapitalize="none" placeholder="ada" />
			<Field.Description>This is how other people will find you.</Field.Description>
		</Field>
	);
}
