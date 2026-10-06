import { Calendar, type CalendarDate } from "@delacour/react-native-ui/calendar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Several days",
	caption: '`mode="multiple"` toggles each day in and out. The list comes back sorted, earliest first.',
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [days, setDays] = useState<readonly CalendarDate[]>([
		{ year: 2026, month: 10, day: 6 },
		{ year: 2026, month: 10, day: 8 },
		{ year: 2026, month: 10, day: 13 },
		{ year: 2026, month: 10, day: 20 },
	]);

	return (
		<View className="gap-3">
			<Calendar mode="multiple" onSelect={setDays} selected={days} testID="calendar-multiple" today={TODAY} />
			<Text.Caption align="center" color="muted" testID="calendar-multiple-count">
				{`${days.length} ${days.length === 1 ? "day" : "days"} selected`}
			</Text.Caption>
		</View>
	);
}
