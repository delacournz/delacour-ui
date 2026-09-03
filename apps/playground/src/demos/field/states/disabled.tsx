import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption:
		"The label fades and the control blocks editing. The description does not fade — dimmed copy on top of a dimmed control reads as two problems rather than one state.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field isDisabled>
			<Field.Label>Account ID</Field.Label>
			<Input defaultValue="acct_8813" />
			<Field.Description>Assigned when the account was created.</Field.Description>
		</Field>
	);
}
