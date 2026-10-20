import type { CalendarDate, CalendarDateRange } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom format and locale",
	caption:
		"`locale` names the months on the trigger and in the calendar, and sets the week's first day. `format` replaces the day formatter — here ISO 8601 — and `formatRange` replaces a whole range.",
	align: "stretch",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

function iso({ year, month, day }: CalendarDate): string {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>(TODAY);
	const [range, setRange] = useState<CalendarDateRange>({ start: TODAY, end: { year: 2026, month: 10, day: 9 } });

	return (
		<View className="gap-3">
			<DatePicker locale="de-DE" onValueChange={setDay} title="Datum" today={TODAY} value={day} />
			<DatePicker format={iso} onValueChange={setDay} today={TODAY} value={day} />
			<DatePicker
				formatRange={({ start, end }) => (start && end ? `${iso(start)} → ${iso(end)}` : "Pick the dates")}
				mode="range"
				onValueChange={setRange}
				today={TODAY}
				value={range}
			/>
		</View>
	);
}
