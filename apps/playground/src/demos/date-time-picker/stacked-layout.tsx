import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked",
	caption:
		'`layout="stacked"` draws the calendar, a hairline and a time row; tapping the row opens the wheel beneath it. Both halves are on screen at once — for tablets and tall sheets.',
	align: "stretch",
};

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>({
		date: { year: 2026, month: 10, day: 14 },
		time: { hour: 9, minute: 30 },
	});

	return (
		<DateTimePicker
			accessibilityLabel="Reminder"
			layout="stacked"
			onValueChange={setWhen}
			testID="date-time-picker-stacked"
			title="Reminder"
			value={when}
		/>
	);
}
