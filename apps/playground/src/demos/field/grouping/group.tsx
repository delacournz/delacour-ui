import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group",
	caption:
		"Spacing, and nothing else. `Field.Group` inserts no dividers — unlike `ListGroup`, where a wall of rows needs them. Fields are already held apart by whitespace.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field.Group>
			<Field>
				<Field.Label>First name</Field.Label>
				<Input placeholder="Ada" />
			</Field>
			<Field>
				<Field.Label>Last name</Field.Label>
				<Input placeholder="Lovelace" />
			</Field>
		</Field.Group>
	);
}
