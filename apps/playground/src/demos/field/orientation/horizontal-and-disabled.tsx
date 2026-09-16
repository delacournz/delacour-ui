import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal and disabled",
	caption: "The same channel carries `isDisabled`, so the box blocks its own press and fades with the label naming it.",
};

export function Demo(): ReactElement {
	return (
		<Field isDisabled orientation="horizontal">
			<Field.Label>Share anonymous usage data</Field.Label>
			<Checkbox color="primary" defaultChecked />
		</Field>
	);
}
