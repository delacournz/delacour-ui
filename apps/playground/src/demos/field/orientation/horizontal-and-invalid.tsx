import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Horizontal and invalid",
	caption:
		"The cascade works on either axis, and it reaches the control. The checkbox below names no state of its own — both it and the label turn destructive from the `Field`.",
};

export function Demo(): ReactElement {
	return (
		<Field isInvalid orientation="horizontal">
			<Field.Content>
				<Field.Label>Accept the terms</Field.Label>
				<Field.Error>You must accept the terms to continue.</Field.Error>
			</Field.Content>
			<Checkbox testID="terms" />
		</Field>
	);
}
