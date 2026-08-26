import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a Field",
	caption:
		"`Field.Label` names the control from a row away, so the box is bare — and the whole row is the target, so tapping the label or its description ticks the box. The invalid field reddens it with nothing said at the checkbox, and the third one opts out.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Field.Group>
			<Field orientation="horizontal">
				<Field.Content>
					<Field.Label>Sync across devices</Field.Label>
					<Field.Description>Your drafts follow you to every device you sign in on.</Field.Description>
				</Field.Content>
				<Checkbox color="primary" defaultChecked testID="checkbox-sync" />
			</Field>
			<Field isInvalid orientation="horizontal">
				<Field.Content>
					<Field.Label>Accept the terms</Field.Label>
					<Field.Error>You must accept the terms to continue.</Field.Error>
				</Field.Content>
				<Checkbox testID="checkbox-terms" />
			</Field>
			<Field isInvalid orientation="horizontal">
				<Field.Label>Opted out of the invalid field</Field.Label>
				<Checkbox color="success" defaultChecked isInvalid={false} testID="checkbox-opt-out" />
			</Field>
		</Field.Group>
	);
}
