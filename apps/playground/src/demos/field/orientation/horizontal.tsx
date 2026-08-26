import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal",
	caption:
		"Label beside control, for something small enough to sit on one line. The box carries no label of its own — the field already named it, and a `Checkbox.Label` here would name it twice. Tap anywhere on the row, not just the box.",
};

export function Demo(): ReactElement {
	return (
		<Field.Group>
			<Field orientation="horizontal">
				<Field.Label>Subscribe to the newsletter</Field.Label>
				<Checkbox color="primary" testID="newsletter" />
			</Field>
			<Field orientation="horizontal">
				<Field.Label>Show read receipts</Field.Label>
				<Checkbox color="primary" defaultChecked testID="read-receipts" />
			</Field>
		</Field.Group>
	);
}
