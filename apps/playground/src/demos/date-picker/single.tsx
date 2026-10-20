import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DatePicker } from "@delacour/react-native-ui/date-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single day",
	caption:
		"A field that opens a calendar in a bottom sheet. Picking a day closes the sheet a beat later, so the selection is seen; the trigger's text is formatted from the value, never stored beside it.",
	align: "stretch",
	capture: { flow: true, frame: "device", hero: true },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [day, setDay] = useState<CalendarDate | null>({ year: 2026, month: 10, day: 14 });

	// Captured as a whole screen, so the trigger sits in the upper third where the open sheet
	// leaves it in view.
	return (
		<View className="flex-1 px-screen-gutter pt-40">
			<DatePicker
				accessibilityLabel="Due date"
				onValueChange={setDay}
				testID="date-picker-single"
				title="Due date"
				today={TODAY}
				value={day}
			/>
		</View>
	);
}
