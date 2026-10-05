import { Field } from "@delacour/react-native-ui/field";
import { Select } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a Field",
	caption:
		"Inside a `Field` the select takes its invalid and disabled state, reads `Field.Label` as its accessible name and its sheet title, and opens when the label is tapped.",
};

const ROLES = [
	{ label: "Designer", value: "designer" },
	{ label: "Engineer", value: "engineer" },
	{ label: "Product manager", value: "pm" },
] as const;

export function Demo(): ReactElement {
	const [role, setRole] = useState<string | null>(null);
	const error = role ? undefined : "Choose a role to continue.";

	return (
		<Field isInvalid={Boolean(error)}>
			<Field.Label>Role</Field.Label>
			<Select onValueChange={setRole} options={ROLES} placeholder="Choose" testID="select-field" value={role} />
			<Field.Description>Shown on your profile.</Field.Description>
			<Field.Error>{error}</Field.Error>
		</Field>
	);
}
