import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { CalendarDate, CalendarSelectionState, DateMatcher, Weekday } from "../calendar/calendar.date";
import type { CalendarCaptionLayout, CalendarMessages } from "../calendar/calendar.types";
import type { CalendarSize } from "../calendar/calendar.variants";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { DatePickerMode, DatePickerPresentation, ResolvedDatePickerMessages } from "./date-picker.variants";

export type DatePickerContextValue = {
	mode: DatePickerMode;
	/** The committed selection — what `onValueChange` last reported. */
	value: CalendarSelectionState;
	/**
	 * What the trigger and the calendar show: the committed selection, or a half-picked range
	 * held inside the open sheet.
	 */
	shown: CalendarSelectionState;
	/** The trigger's text, or `undefined` while nothing is picked. */
	display: string | undefined;
	/** The text shown in place of an empty value. */
	placeholder: string;
	/** What a screen reader hears as the trigger's value. */
	accessibilityValue: string;
	/** The trigger's accessible name. */
	accessibilityLabel: string;
	messages: ResolvedDatePickerMessages;
	isOpen: boolean;
	/** The root's `testID`, which the parts derive theirs from — `resolvePartTestID`. */
	testID: string | undefined;
	/** Opens the sheet. Ignored while disabled or read-only. */
	open: () => void;
	/** Closes the sheet, discarding a half-picked range. */
	close: () => void;
	/** Empties the selection, reports it, and leaves the sheet open. */
	clear: () => void;
	/** Applies a calendar change through the finish rule — commit, hold or close. */
	select: (next: CalendarSelectionState) => void;
	hasValue: boolean;
	canOpen: boolean;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	isClearable: boolean;
	locale: string | undefined;
	variant: InputVariant;
	size: InputSize;
	presentation: DatePickerPresentation;
	title: string;
	doneLabel: string;
	clearLabel: string;
	calendar: {
		size: CalendarSize;
		minDate: CalendarDate | undefined;
		maxDate: CalendarDate | undefined;
		disabled: readonly DateMatcher[] | undefined;
		weekStartsOn: Weekday | "auto";
		captionLayout: CalendarCaptionLayout;
		messages: CalendarMessages;
		selectOutsideDays: boolean;
		today: CalendarDate | undefined;
	};
};

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

/**
 * Supplies one picker's state to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part reads it without
 * importing `./date-picker` and closing a cycle (AGENTS.md rule 3) — and so `date-time-picker` can
 * read it as a leaf.
 */
export function DatePickerProvider({
	value,
	children,
}: {
	value: DatePickerContextValue;
	children: ReactNode;
}): ReactElement {
	return <DatePickerContext value={value}>{children}</DatePickerContext>;
}
DatePickerProvider.displayName = "DelacourUI.DatePicker.Provider";

/** The enclosing picker's state, or null outside a `<DatePicker>`. */
export function useDatePickerContext(): DatePickerContextValue | null {
	return use(DatePickerContext);
}

/**
 * Reads the enclosing picker's state — for a custom trigger or footer that has to match it.
 * Throws outside one; use {@link useDatePickerContext} where the picker is optional.
 */
export function useDatePicker(): DatePickerContextValue {
	const context = useDatePickerContext();
	if (!context) {
		throw new Error("useDatePicker must be called inside a <DatePicker>.");
	}
	return context;
}

/** The enclosing picker's state, for a part that cannot work without one. Internal. */
export function useDatePickerPart(component: string): DatePickerContextValue {
	const context = useDatePickerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <DatePicker>.`);
	}
	return context;
}
