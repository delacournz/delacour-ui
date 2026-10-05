import { Calendar, type CalendarDate } from "@delacour/react-native-ui/calendar";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"Inside a `Field`, the calendar takes `isInvalid` and `isDisabled` with nothing said at the call site, and the field's label names the grid for a screen reader. Here the selection turns destructive until a day is picked.",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>(null);

	return (
		<Field isInvalid={day === null}>
			<Field.Label>Delivery day</Field.Label>
			<Calendar minDate={TODAY} onSelect={setDay} selected={day} testID="calendar-field" today={TODAY} />
			<Field.Error>Pick a day for the delivery.</Field.Error>
		</Field>
	);
}
