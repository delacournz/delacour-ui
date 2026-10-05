import type { ReactElement } from "react";
import { Calendar, type CalendarProps } from "../calendar";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDatePickerPart } from "./date-picker.context";

export type DatePickerCalendarProps = Omit<
	CalendarProps,
	| "mode"
	| "selected"
	| "defaultSelected"
	| "onSelect"
	| "minDate"
	| "maxDate"
	| "disabled"
	| "locale"
	| "isDisabled"
	| "isInvalid"
	| "isReadOnly"
>;

/**
 * The calendar inside the sheet, bound to the picker.
 *
 * Takes the root's bounds, locale and states, shows what the picker shows — a half-picked range
 * included — and hands every tap to the picker's finish rule rather than straight to the caller:
 * a single day commits and closes, a range commits and closes once both ends exist, several days
 * commit on every toggle and stay open. Every other `Calendar` prop passes through.
 */
export function DatePickerCalendar(props: DatePickerCalendarProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Calendar");
	const { calendar, shown, select } = picker;
	const common = {
		captionLayout: calendar.captionLayout,
		disabled: calendar.disabled,
		isDisabled: picker.isDisabled,
		isInvalid: picker.isInvalid,
		isReadOnly: picker.isReadOnly,
		locale: picker.locale,
		maxDate: calendar.maxDate,
		minDate: calendar.minDate,
		selectOutsideDays: calendar.selectOutsideDays,
		size: calendar.size,
		today: calendar.today,
		testID: resolvePartTestID(picker.testID, "calendar"),
		weekStartsOn: calendar.weekStartsOn,
		...props,
	};

	switch (shown.mode) {
		case "range":
			return (
				<Calendar
					{...common}
					mode="range"
					onSelect={(value) => select({ mode: "range", value })}
					selected={shown.value}
				/>
			);
		case "multiple":
			return (
				<Calendar
					{...common}
					mode="multiple"
					onSelect={(value) => select({ mode: "multiple", value })}
					selected={shown.value}
				/>
			);
		case "single":
			return (
				<Calendar
					{...common}
					mode="single"
					onSelect={(value) => select({ mode: "single", value })}
					selected={shown.value}
				/>
			);
	}
}
DatePickerCalendar.displayName = "DelacourUI.DatePicker.Calendar";
