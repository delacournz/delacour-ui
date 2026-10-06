import { type ReactElement, type ReactNode, useCallback } from "react";
import { View } from "react-native";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useCalendarPart } from "./calendar.context";
import { type CalendarDate, formatDate, isSameMonth, serialiseDate } from "./calendar.date";
import { type CalendarDayState, calendarVariants, resolveDayState, resolvePartTestID } from "./calendar.variants";

/** What a function child of `Calendar.Day` is handed. */
export type CalendarDayRenderProps = CalendarDayState & {
	date: CalendarDate;
	/** The class the default number is drawn with — size, weight and colour for this state. */
	labelClassName: string;
};

export type CalendarDayProps = {
	/** The day this cell draws. */
	date: CalendarDate;
	/**
	 * Custom content inside the circle, in place of the number. A function is handed the day's
	 * state, so a price under the number can take the selected colour with it.
	 */
	children?: ReactNode | ((props: CalendarDayRenderProps) => ReactNode);
	className?: string;
};

/** The state words a screen reader adds after the date. */
function describeState(state: CalendarDayState): string | undefined {
	const parts: string[] = [];
	if (state.isToday) parts.push("Today");
	if (state.rangeRole === "start") parts.push("Range start");
	if (state.rangeRole === "end") parts.push("Range end");
	return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * One day: its column share, the range band behind it, and the circle with the number.
 *
 * **The whole cell is the target**, not the circle — a column on a phone is wider than the
 * circle is tall, and the gap between two circles belongs to whichever day it sits beside.
 *
 * The band is drawn for a range's start, middle and end and never for a lone day, which is a
 * circle with nothing to join. An outside day with `showOutsideDays` off is an empty cell of the
 * same height, so the grid's rows never move.
 *
 * Announced as a button with the full date — "Monday 5 October 2026" — plus today and the range
 * end it is, and `selected` and `disabled` as accessibility state.
 */
export function CalendarDay({ date, children, className }: CalendarDayProps): ReactElement {
	const calendar = useCalendarPart("Calendar.Day");
	const state = resolveDayState({
		cell: { date, isOutside: !isSameMonth(date, calendar.visibleMonth), weekIndex: 0, dayIndex: 0 },
		isCalendarDisabled: calendar.isDisabled,
		isDisabled: calendar.isDateDisabled,
		isReadOnly: calendar.isReadOnly,
		selectOutsideDays: calendar.selectOutsideDays,
		selection: calendar.selection,
		showOutsideDays: calendar.showOutsideDays,
		today: calendar.today,
	});
	const slots = calendarVariants({
		isDisabled: state.isDisabled,
		isInvalid: calendar.isInvalid,
		isOutside: state.isOutside,
		isToday: state.isToday,
		rangeRole: state.rangeRole ?? "none",
		size: calendar.size,
		tone: state.tone,
		variant: calendar.variant,
	});

	const { select } = calendar;
	const handlePress = useCallback(() => select(date), [date, select]);

	if (state.isHidden) {
		return <View className={slots.cell({ className })} importantForAccessibility="no-hide-descendants" />;
	}

	const labelClassName = slots.dayLabel();
	const content =
		typeof children === "function"
			? children({ ...state, date, labelClassName })
			: (children ?? <Text className={labelClassName}>{date.day}</Text>);
	const showsBand = state.rangeRole !== null && state.rangeRole !== "only";

	return (
		<Pressable
			accessibilityHint={describeState(state)}
			accessibilityLabel={formatDate(date, { locale: calendar.locale, style: "full" })}
			accessibilityState={{ selected: state.isSelected }}
			className={slots.cell({ className })}
			disabled={!state.isPressable}
			feedback="fade"
			haptic="selection"
			onPress={handlePress}
			testID={resolvePartTestID(calendar.testID, `day-${serialiseDate(date)}`)}
		>
			{showsBand ? <View className={slots.band()} /> : null}
			<View className={slots.dayBase()}>{content}</View>
		</Pressable>
	);
}
CalendarDay.displayName = "DelacourUI.Calendar.Day";
