import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { useCalendarPart } from "./calendar.context";
import { weekdayLabels } from "./calendar.date";
import { calendarVariants } from "./calendar.variants";

export type CalendarWeekdaysProps = Omit<ViewProps, "children"> & {
	className?: string;
	/** How the names are drawn. The accessible name is always the full one. */
	format?: "narrow" | "short";
};

/**
 * The row of weekday names, in the grid's column order and the calendar's locale.
 *
 * Each column says its short name and is announced by its full one, so a screen reader reads
 * "Monday" rather than "Mon" — or "M", which is two different days. Hidden, not removed, while a
 * jump view is open, so the calendar's height holds still.
 */
export function CalendarWeekdays({ className, format = "short", ...props }: CalendarWeekdaysProps): ReactElement {
	const { locale, size, variant, view, weekStartsOn } = useCalendarPart("Calendar.Weekdays");
	const slots = calendarVariants({ size, variant });
	const isHidden = view !== "days";

	const names = useMemo(
		() => ({ shown: weekdayLabels(locale, weekStartsOn, format), spoken: weekdayLabels(locale, weekStartsOn, "long") }),
		[format, locale, weekStartsOn]
	);

	return (
		<View
			accessibilityElementsHidden={isHidden}
			className={slots.weekdays({ className: [isHidden ? "opacity-0" : undefined, className] })}
			importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
			{...props}
		>
			{names.shown.map((name, index) => (
				<View className={slots.weekday()} key={names.spoken[index]}>
					<Text accessibilityLabel={names.spoken[index]} className={slots.weekdayLabel()}>
						{name}
					</Text>
				</View>
			))}
		</View>
	);
}
CalendarWeekdays.displayName = "DelacourUI.Calendar.Weekdays";
