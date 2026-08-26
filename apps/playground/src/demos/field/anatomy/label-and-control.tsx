import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Label and control",
	caption: "The minimum. `Field.Label` is `Text.Label` — it renders the preset, never its own scale.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Full name</Field.Label>
			<Input placeholder="Ada Lovelace" />
		</Field>
	);
}
