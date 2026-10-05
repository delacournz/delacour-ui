import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { CalendarDate, DateMatcher, Weekday } from "../calendar/calendar.date";
import type { CalendarCaptionLayout } from "../calendar/calendar.types";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { HourCycle, TimeBounds, TimeMinuteStep, TimeValue } from "../time-picker/time-picker.time";
import type { DateTimeValue } from "./date-time-picker.value";
import type {
	DateTimePickerLayout,
	DateTimePickerPresentation,
	DateTimePickerSection,
} from "./date-time-picker.variants";

export type DateTimePickerContextValue = {
	/** The chosen date and time, or `null` while none is set. Never half a value. */
	value: DateTimeValue | null;
	/** Applies a calendar pick: completes an empty value from the clock, re-clamps the time to the new day. */
	setDate: (date: CalendarDate) => void;
	/** Applies a wheel settle: completes an empty value on today, holds the time inside the day's bounds. */
	setTime: (time: TimeValue) => void;
	/** Replaces the whole value. */
	setValue: (value: DateTimeValue | null) => void;
	/** The trigger's text, or `undefined` while nothing is set. */
	display: string | undefined;
	placeholder: string;
	/** The time row's readout — the time alone, or a dash. */
	timeReadout: string;
	/** The trigger's accessible name, already resolved through the field. */
	accessibilityLabel: string;
	/** What a screen reader hears as the trigger's value. */
	accessibilityValue: string;
	isOpen: boolean;
	/** Opens the sheet. Ignored while disabled, read-only or inline. */
	open: () => void;
	/** Closes the sheet. The value is already committed. */
	close: () => void;
	/** Announces the composed value, plays a light impact and closes. */
	done: () => void;
	/** Sets the value to `null` and keeps the sheet open. */
	clear: () => void;
	/** Which half a `tabs` layout shows. */
	activeSection: DateTimePickerSection;
	setActiveSection: (section: DateTimePickerSection) => void;
	/** Whether the `stacked` layout's wheel is open under its row. */
	isTimeExpanded: boolean;
	setTimeExpanded: (expanded: boolean) => void;
	/** The bounds the wheel applies — those of the chosen day, or of the day an empty value would take. */
	timeBoundsForDate: TimeBounds;
	hasValue: boolean;
	canOpen: boolean;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	isClearable: boolean;
	/** The resolved locale — never `undefined`. */
	locale: string;
	/** The resolved hour cycle — never `"auto"`. */
	hourCycle: HourCycle;
	layout: DateTimePickerLayout;
	presentation: DateTimePickerPresentation;
	variant: InputVariant;
	size: InputSize;
	title: string;
	doneLabel: string;
	clearLabel: string;
	dateLabel: string;
	timeLabel: string;
	calendar: {
		minDate: CalendarDate | undefined;
		maxDate: CalendarDate | undefined;
		disabled: readonly DateMatcher[] | undefined;
		weekStartsOn: Weekday | "auto";
		captionLayout: CalendarCaptionLayout;
		today: CalendarDate | undefined;
	};
	wheel: { minuteStep: TimeMinuteStep; showSeconds: boolean };
	/** The root's `testID`, which every part derives its own from. */
	testID: string | undefined;
};

const DateTimePickerContext = createContext<DateTimePickerContextValue | null>(null);

/**
 * Supplies one picker's state to its parts.
 *
 * Its own module, importing nothing but React and types, so a part reads it without importing
 * `./date-time-picker` and closing a cycle (package rule 3).
 */
export function DateTimePickerProvider({
	value,
	children,
}: {
	value: DateTimePickerContextValue;
	children: ReactNode;
}): ReactElement {
	return <DateTimePickerContext value={value}>{children}</DateTimePickerContext>;
}
DateTimePickerProvider.displayName = "DelacourUI.DateTimePicker.Provider";

/** The enclosing picker's state, or null outside a `<DateTimePicker>`. */
export function useDateTimePickerContext(): DateTimePickerContextValue | null {
	return use(DateTimePickerContext);
}

/**
 * Reads the enclosing picker — for a custom trigger, section or footer that has to drive it or
 * match it. Throws outside one; use {@link useDateTimePickerContext} where the picker is optional.
 */
export function useDateTimePicker(): DateTimePickerContextValue {
	const context = useDateTimePickerContext();
	if (!context) {
		throw new Error("useDateTimePicker must be called inside a <DateTimePicker>.");
	}
	return context;
}

/** The enclosing picker, for a part that cannot work without one. Internal. */
export function useDateTimePickerPart(component: string): DateTimePickerContextValue {
	const context = useDateTimePickerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <DateTimePicker>.`);
	}
	return context;
}
