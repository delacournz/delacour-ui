import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"Inside a `Field` the trigger takes `isInvalid` and `isDisabled` with nothing said at the call site, names itself from `Field.Label`, and a tap on the label opens the sheet. Invalid until a date and time are set; Clear empties it again.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>(null);

	return (
		<Field isInvalid={when === null}>
			<Field.Label>Departure</Field.Label>
			<DateTimePicker isClearable onValueChange={setWhen} testID="date-time-picker-field" value={when}>
				<DateTimePicker.Trigger />
				<DateTimePicker.Content title="Departure">
					<DateTimePicker.Calendar />
					<DateTimePicker.Time />
				</DateTimePicker.Content>
			</DateTimePicker>
			<Field.Error>Choose a departure time.</Field.Error>
		</Field>
	);
}
