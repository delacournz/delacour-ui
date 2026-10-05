import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DateTimePicker, type DateTimeValue } from "@delacour/react-native-ui/date-time-picker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Quarter hours, 24-hour clock",
	caption:
		"`minuteStep={15}` and `hourCycle={24}`, in en-GB. Month names, the trigger's text and the wheel all follow the locale; the stored hour is 24-hour whatever the clock shows.",
	align: "stretch",
	capture: { flow: "date-time-picker/step-15-24h", frame: "device" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>({
		date: { year: 2026, month: 10, day: 5 },
		time: { hour: 15, minute: 0 },
	});

	return (
		<View className="flex-1 px-screen-gutter pt-40">
			<DateTimePicker
				accessibilityLabel="Kick-off"
				hourCycle={24}
				locale="en-GB"
				minuteStep={15}
				onValueChange={setWhen}
				testID="date-time-picker-24h"
				title="Kick-off"
				today={TODAY}
				value={when}
			/>
		</View>
	);
}
