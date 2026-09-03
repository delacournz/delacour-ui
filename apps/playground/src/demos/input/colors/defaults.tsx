import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Defaults",
	caption:
		"Nothing is passed here. The placeholder is the muted token and the caret is primary, so both follow the theme — toggle light and dark from the gallery index and they move with it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Default</Field.Label>
			<Input defaultValue="Select this text" placeholder="A themed placeholder" />
		</Field>
	);
}
