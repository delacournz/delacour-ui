import type { CalendarDate } from "@delacour/react-native-ui/calendar";
import { DateTimePicker, type DateTimeValue, formatDateTime } from "@delacour/react-native-ui/date-time-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline",
	caption: '`presentation="inline"` draws the panel in place on a card, with no trigger, no sheet and no Done.',
	align: "stretch",
	capture: {},
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

export function Demo(): ReactElement {
	const [when, setWhen] = useState<DateTimeValue | null>({
		date: { year: 2026, month: 10, day: 5 },
		time: { hour: 18, minute: 0 },
	});

	return (
		<View className="gap-3">
			<DateTimePicker
				minuteStep={5}
				onValueChange={setWhen}
				presentation="inline"
				testID="date-time-picker-inline"
				today={TODAY}
				value={when}
			/>
			<Text.Caption className="text-center">
				{when ? formatDateTime(when, { hourCycle: 12, locale: "en-US" }) : "Not set"}
			</Text.Caption>
		</View>
	);
}
