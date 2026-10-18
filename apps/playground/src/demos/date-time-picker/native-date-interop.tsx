import {
	DateTimePicker,
	fromNativeDate,
	serialiseDateTime,
	toNativeDate,
} from "@delacour/react-native-ui/date-time-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Native Date in, native Date out",
	caption:
		"The state here is a `Date`. `fromNativeDate` and `toNativeDate` read and write local fields, so the day and hour are the ones the phone shows; `serialiseDateTime` writes the zone-free ISO form an API stores.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [date, setDate] = useState<Date>(() => new Date(2026, 9, 5, 15, 30));

	return (
		<View className="gap-3">
			<DateTimePicker
				accessibilityLabel="Meeting"
				onValueChange={(next) => {
					if (next) setDate(toNativeDate(next));
				}}
				testID="date-time-picker-native"
				title="Meeting"
				value={fromNativeDate(date)}
			/>
			<Text.Caption className="text-center">{serialiseDateTime(fromNativeDate(date))}</Text.Caption>
		</View>
	);
}
