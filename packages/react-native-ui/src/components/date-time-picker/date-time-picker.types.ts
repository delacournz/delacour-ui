import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { CalendarDate, DateMatcher, Weekday } from "../calendar/calendar.date";
import type { CalendarCaptionLayout } from "../calendar/calendar.types";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { HourCycle, TimeMinuteStep } from "../time-picker/time-picker.time";
import type { DateTimeValue } from "./date-time-picker.value";
import type {
	DateTimePickerFormat,
	DateTimePickerLayout,
	DateTimePickerPresentation,
} from "./date-time-picker.variants";

export type DateTimePickerProps = Omit<ViewProps, "children"> & {
	/** The chosen date and time, controlled. `null` is "not set" and shows the placeholder. */
	value?: DateTimeValue | null;
	/** The starting value, uncontrolled. */
	defaultValue?: DateTimeValue | null;
	/**
	 * Fires on every date pick and every wheel settle, always with a whole value — a date picked
	 * first takes a time from the clock, a time picked first takes today — and with `null` on Clear.
	 */
	onValueChange?: (value: DateTimeValue | null) => void;
	/**
	 * The earliest moment that can be picked, inclusive. Bounds the calendar to its day and the
	 * wheel to its time on that day only, so it composes where a separate `minDate` and `minTime`
	 * would not.
	 */
	minDateTime?: DateTimeValue;
	/** The latest moment that can be picked, inclusive. */
	maxDateTime?: DateTimeValue;
	/** Further days that cannot be picked. */
	disabledDates?: readonly DateMatcher[];
	/** The minute wheel's granularity. Default 1. */
	minuteStep?: TimeMinuteStep;
	/** 12 or 24, or `"auto"` to follow the locale. Display only — a stored time is always 24-hour. */
	hourCycle?: HourCycle | "auto";
	/** Add a seconds wheel. Default `false`. */
	showSeconds?: boolean;
	/** A BCP 47 tag for month names, the time and the trigger text. Omitted, the device's. */
	locale?: string;
	/** The calendar's first column. `auto` reads it from the locale. */
	weekStartsOn?: Weekday | "auto";
	/** `picker` makes the calendar's caption open the month and year views. Default `picker`. */
	captionLayout?: CalendarCaptionLayout;
	/** Overrides today — on the calendar, and as the day a time picked first lands on. For a demo, a screenshot or a test. */
	today?: CalendarDate;
	/** Replaces the trigger's text. Gets the resolved locale and hour cycle. */
	format?: DateTimePickerFormat;
	/** Shown while nothing is set. Default "Select date and time". */
	placeholder?: string;
	/** `tabs` shows one half at a time behind Date and Time tabs; `stacked` shows both. Default `tabs`. */
	layout?: DateTimePickerLayout;
	/** `sheet` puts a trigger on screen and the panel in a bottom sheet; `inline` draws the panel in place. */
	presentation?: DateTimePickerPresentation;
	/** Whether the sheet is open, controlled. */
	isOpen?: boolean;
	/** Whether the sheet starts open, uncontrolled. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** Inert and faded everywhere, inline included. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Shows the value and never opens; inline, the panel shows and cannot be changed. */
	isReadOnly?: boolean;
	/** A destructive border and glyph. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** The trigger's box, on the `Input` axes. */
	variant?: InputVariant;
	/** The trigger's box and type, on the `Input` scale. The panel inside is always `md`. */
	size?: InputSize;
	/** The sheet's title. Default "Select date and time". */
	title?: string;
	/** Done's label. Default "Done". */
	doneLabel?: string;
	/** Clear's label. Default "Clear". */
	clearLabel?: string;
	/** The Date tab's label. Default "Date". */
	dateLabel?: string;
	/** The Time tab's — and the time row's — label. Default "Time". */
	timeLabel?: string;
	/** Offers Clear beside Done, which sets the value back to `null`. Default `false`. */
	isClearable?: boolean;
	/** The trigger's accessible name. Omitted, the enclosing `Field.Label`'s text, else "Date and time". */
	accessibilityLabel?: string;
	className?: string;
	/**
	 * Lands on the root, and names every part after it: `-trigger`, `-calendar` (so a day is
	 * `-calendar-day-2026-10-14`), `-tab-date`, `-tab-time`, `-time-row`, `-time-wheel`, `-title`,
	 * `-close`, `-clear` and `-done`. No root `testID`, no part ids.
	 */
	testID?: string;
	/** A custom anatomy. Omitted, the trigger and the sheet — or, inline, the panel. */
	children?: ReactNode;
};
