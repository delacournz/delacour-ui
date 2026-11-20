import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Date of birth",
	caption:
		'`initialView="years"` opens an empty picker on the year list: a year opens its months, a month its days. Once a day is picked, the sheet reopens on that month.',
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [dob, setDob] = useState<CalendarDate | null>(null);

	return (
		<Field>
			<Field.Label>Date of birth</Field.Label>
			<DatePicker
				defaultMonth={{ year: TODAY.year - 30, month: 1, day: 1 }}
				initialView="years"
				maxDate={{ year: TODAY.year - 18, month: TODAY.month, day: TODAY.day }}
				minDate={{ year: TODAY.year - 120, month: 1, day: 1 }}
				onValueChange={setDob}
				testID="date-picker-dob"
				title="Date of birth"
				today={TODAY}
				value={dob}
			/>
			<Field.Description>You must be 18 or over.</Field.Description>
		</Field>
	);
}
