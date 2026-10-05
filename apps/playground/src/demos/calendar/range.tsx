import {
	Calendar,
	type CalendarDate,
	type CalendarDateRange,
	formatDateRange,
} from "@delacour/react-native-ui/calendar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Range",
	caption:
		"Two taps make a range, drawn as one band rounded only at its ends. The second tap can come before the first; a tap on a complete range begins a new one.",
	capture: { flow: "calendar/range", align: "stretch" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [stay, setStay] = useState<CalendarDateRange>({
		start: { year: 2026, month: 10, day: 9 },
		end: { year: 2026, month: 10, day: 15 },
	});

	return (
		<View className="gap-3">
			<Calendar minDate={TODAY} mode="range" onSelect={setStay} selected={stay} testID="calendar-range" today={TODAY} />
			<Text.Caption align="center" color="muted" testID="calendar-range-value">
				{formatDateRange(stay, { style: "medium" }) || "Pick a check-in day"}
			</Text.Caption>
		</View>
	);
}
