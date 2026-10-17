import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bounds and disabled weekends",
	caption:
		"`minDate` and `maxDate` bound the calendar inside the sheet, and `disabledDates` takes the calendar's matchers — here every weekend, for a delivery that only runs on weekdays.",
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>(null);

	return (
		<Field>
			<Field.Label>Delivery day</Field.Label>
			<DatePicker
				disabledDates={[{ type: "weekday", days: [0, 6] }]}
				maxDate={{ year: 2026, month: 11, day: 30 }}
				minDate={TODAY}
				onValueChange={setDay}
				testID="date-picker-bounds"
				today={TODAY}
				value={day}
			/>
			<Field.Description>Weekdays only, before the end of November.</Field.Description>
		</Field>
	);
}
