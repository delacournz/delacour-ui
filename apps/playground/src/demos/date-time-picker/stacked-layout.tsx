import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked",
	caption:
		'`layout="stacked"` draws the calendar, a hairline and a time row; tapping the row opens the wheel beneath it. Both halves are on screen at once — for tablets and tall sheets.',
	align: "stretch",
	capture: { flow: true, frame: "device" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>({
		date: { year: 2026, month: 10, day: 14 },
		time: { hour: 9, minute: 0 },
	});

	return (
		<View className="flex-1 px-screen-gutter pt-24">
			<DateTimePicker
				accessibilityLabel="Reminder"
				layout="stacked"
				onValueChange={setWhen}
				testID="date-time-picker-stacked"
				title="Reminder"
				today={TODAY}
				value={when}
			/>
		</View>
	);
}
