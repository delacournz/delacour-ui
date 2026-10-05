import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"Inside a `Field` the trigger takes `isInvalid` and `isDisabled` with nothing said at the call site, names itself from `Field.Label`, and a tap on the label opens the sheet. Invalid here until a day is picked.",
	capture: { align: "stretch" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>(null);

	return (
		<Field isInvalid={day === null}>
			<Field.Label>Date of birth</Field.Label>
			<DatePicker
				maxDate={TODAY}
				onValueChange={setDay}
				testID="date-picker-field"
				title="Date of birth"
				today={TODAY}
				value={day}
			/>
			<Field.Error>Enter your date of birth.</Field.Error>
		</Field>
	);
}
