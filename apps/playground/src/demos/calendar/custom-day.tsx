import { Calendar, type CalendarDate } from "@delacour/react-native-ui/calendar";
import { cn } from "@delacour/react-native-ui/lib/cn";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom day content",
	caption:
		"`Calendar.Grid`'s `renderDay` draws each cell. A `Calendar.Day` given a function child is handed the day's state, so a nightly price can take the selected colour with the number above it.",
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

/** A made-up nightly rate: weekends cost more. */
function priceOf(date: CalendarDate): number {
	const weekday = new Date(date.year, date.month - 1, date.day).getDay();
	return weekday === 5 || weekday === 6 ? 240 : 180;
}

export function Demo(): ReactElement {
	return (
		<Calendar mode="range" size="lg" testID="calendar-custom-day" today={TODAY}>
			<Calendar.Header />
			<Calendar.Weekdays />
			<Calendar.Grid
				renderDay={(cell) => (
					<Calendar.Day date={cell.date}>
						{({ date, labelClassName }) => (
							<View className="items-center">
								<Text className={labelClassName}>{date.day}</Text>
								<Text className={cn(labelClassName, "text-[10px] leading-3 opacity-70")}>{`$${priceOf(date)}`}</Text>
							</View>
						)}
					</Calendar.Day>
				)}
			/>
		</Calendar>
	);
}
