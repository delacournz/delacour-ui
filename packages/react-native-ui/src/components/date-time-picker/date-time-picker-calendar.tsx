import { type ReactElement, useCallback } from "react";
import { Calendar, type CalendarProps } from "../calendar";
import type { CalendarDate } from "../calendar/calendar.date";
import { useDateTimePickerPart } from "./date-time-picker.context";

export type DateTimePickerCalendarProps = Omit<
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
	| "size"
>;

/**
 * The date half: a single-day `Calendar`, bound to the picker.
 *
 * Takes the window's two days as its bounds, the picker's disabled days, locale and states, and
 * hands every pick to `setDate` — which completes an empty value from the clock and re-clamps the
 * time when the new day's bounds rule it out. A tap on the chosen day keeps it: a date-time value
 * is never half empty, and Clear is how it empties.
 *
 * Always `md`, whatever the trigger's size. In the `tabs` layout the month swipe is off, so the
 * only horizontal drag in the panel is the tabs' own; the caption's arrows still page.
 */
export function DateTimePickerCalendar(props: DateTimePickerCalendarProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Calendar");
	const { calendar, setDate } = picker;

	const handleSelect = useCallback(
		(date: CalendarDate | null) => {
			if (date) setDate(date);
		},
		[setDate]
	);

	return (
		<Calendar
			captionLayout={calendar.captionLayout}
			disabled={calendar.disabled}
			isDisabled={picker.isDisabled}
			isInvalid={picker.isInvalid}
			isReadOnly={picker.isReadOnly}
			locale={picker.locale}
			maxDate={calendar.maxDate}
			minDate={calendar.minDate}
			swipeToPage={picker.layout !== "tabs"}
			weekStartsOn={calendar.weekStartsOn}
			{...props}
			mode="single"
			onSelect={handleSelect}
			selected={picker.value?.date ?? null}
			size="md"
		/>
	);
}
DateTimePickerCalendar.displayName = "DelacourUI.DateTimePicker.Calendar";
