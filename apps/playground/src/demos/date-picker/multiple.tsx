import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Several days",
	caption: '`mode="multiple"` reports every toggle and stays open until Done. The trigger lists two days, then counts.',
	align: "stretch",
	capture: { flow: true, frame: "device" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [days, setDays] = useState<readonly CalendarDate[]>([
		{ year: 2026, month: 10, day: 7 },
		{ year: 2026, month: 10, day: 9 },
	]);

	// Captured as a whole screen, so the trigger sits in the upper third, above the open sheet.
	return (
		<View className="flex-1 px-screen-gutter pt-32">
			<DatePicker
				accessibilityLabel="Shifts"
				mode="multiple"
				onValueChange={setDays}
				testID="date-picker-multiple"
				title="Shifts"
				today={TODAY}
				value={days}
			/>
		</View>
	);
}
