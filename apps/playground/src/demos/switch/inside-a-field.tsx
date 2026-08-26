import { Field } from "@delacour/native-ui/field";
import { Switch } from "@delacour/native-ui/switch";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a Field",
	caption:
		"The switch hands its toggle back up, so tapping the label or the description beside it flips the switch. That is what lets a form switch be a bare `<Switch />` with the field naming it.",
};

export function Demo(): ReactElement {
	const [alerts, setAlerts] = useState(true);
	const [terms, setTerms] = useState(false);

	return (
		<Field.Group>
			<Field orientation="horizontal">
				<Field.Content>
					<Field.Label>Push notifications</Field.Label>
					<Field.Description>Tap this sentence — the row drives the switch.</Field.Description>
				</Field.Content>
				<Switch color="success" isSelected={alerts} onSelectedChange={setAlerts} testID="switch-alerts" />
			</Field>

			<Field isDisabled orientation="horizontal">
				<Field.Label>Sync over cellular</Field.Label>
				<Switch color="success" />
			</Field>

			<Field isInvalid={!terms} orientation="horizontal">
				<Field.Content>
					<Field.Label>Accept the terms</Field.Label>
					<Field.Error>{terms ? undefined : "Required before you can continue."}</Field.Error>
				</Field.Content>
				<Switch isSelected={terms} onSelectedChange={setTerms} testID="switch-terms" />
			</Field>
		</Field.Group>
	);
}
