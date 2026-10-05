import { Calendar, type CalendarDate, formatDate } from "@delacour/react-native-ui/calendar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single day",
	caption:
		"One day, held as a `CalendarDate` — a year, a month and a day with no time zone to shift it. A tap on the selected day clears it. Swipe the grid or tap the arrows to page; tap the caption to jump by month or year.",
	capture: { flow: "calendar/single", hero: true, align: "stretch" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>({ year: 2026, month: 10, day: 14 });

	return (
		<View className="gap-3">
			<Calendar onSelect={setDay} selected={day} testID="calendar-single" today={TODAY} />
			<Text.Caption align="center" color="muted" testID="calendar-single-value">
				{day ? formatDate(day, { style: "full" }) : "No day selected"}
			</Text.Caption>
		</View>
	);
}
