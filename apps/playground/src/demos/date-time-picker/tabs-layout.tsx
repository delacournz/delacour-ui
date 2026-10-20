import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tabs",
	caption:
		"The default layout: Date and Time behind two tabs in one sheet, so it fits the shortest phone. Pick a day on an empty field and the sheet moves to Time once — the time it shows was only a guess from the clock. Every pick commits; Done closes.",
	align: "stretch",
	capture: { flow: true, frame: "device", hero: true },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>({
		date: { year: 2026, month: 10, day: 14 },
		time: { hour: 12, minute: 0 },
	});

	// Captured as a whole screen, so the trigger sits in the upper third where the open sheet
	// leaves it in view.
	return (
		<View className="flex-1 px-screen-gutter pt-40">
			<DateTimePicker
				accessibilityLabel="Appointment"
				minuteStep={5}
				onValueChange={setWhen}
				testID="date-time-picker-tabs"
				title="Appointment"
				today={TODAY}
				value={when}
			/>
		</View>
	);
}
