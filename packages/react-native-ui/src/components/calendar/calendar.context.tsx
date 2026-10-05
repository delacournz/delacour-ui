import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { CalendarDate, CalendarSelectionState, Weekday } from "./calendar.date";
import type { CalendarCaptionLayout } from "./calendar.types";
import type { CalendarRangeRole, CalendarSize, CalendarVariant, CalendarView } from "./calendar.variants";

export type CalendarContextValue = {
	mode: CalendarSelectionState["mode"];
	variant: CalendarVariant;
	size: CalendarSize;
	/** The tag names are formatted in, or `undefined` for the device's own. */
	locale: string | undefined;
	/** The first column's weekday, resolved — never `auto`. */
	weekStartsOn: Weekday;
	/** The first of the month the grid shows. */
	visibleMonth: CalendarDate;
	/**
	 * Which way the last page went: `1` forward, `-1` back, `0` for a jump or the first render. The
	 * grid reads it to slide the new month in from the side it came from.
	 */
	pageDirection: -1 | 0 | 1;
	/** The body's view: the month grid, or a jump view. */
	view: CalendarView;
	setView: (view: CalendarView) => void;
	/** Shows the month `date` falls in, held inside the month bounds. */
	goToMonth: (date: CalendarDate) => void;
	/** One month back. In the months view, one year. */
	goPrev: () => void;
	/** One month forward. In the months view, one year. */
	goNext: () => void;
	canGoPrev: boolean;
	canGoNext: boolean;
	/** The first and last months paging reaches; `null` is unbounded. */
	monthBounds: { first: CalendarDate | null; last: CalendarDate | null };
	/** The years the year view lists. */
	yearSpan: { from: number; to: number };
	/** Whether a day cannot be picked — bounds and matchers, not the calendar's own state. */
	isDateDisabled: (date: CalendarDate) => boolean;
	isDateSelected: (date: CalendarDate) => boolean;
	/** Where a day sits in the range, or `null`. Always `null` outside range mode. */
	rangeRole: (date: CalendarDate) => CalendarRangeRole | null;
	/** The selection, by mode. */
	selection: CalendarSelectionState;
	/** Applies a tap on `date` to the selection. Ignored while disabled, read-only, or on a disabled day. */
	select: (date: CalendarDate) => void;
	today: CalendarDate;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	showOutsideDays: boolean;
	selectOutsideDays: boolean;
	swipeToPage: boolean;
	captionLayout: CalendarCaptionLayout;
	/** The enclosing `Field.Label`'s text, for the grid's accessible name. */
	label: string | null;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

/**
 * Supplies one calendar's state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can read it without
 * importing `./calendar` and closing a cycle (AGENTS.md rule 3).
 */
export function CalendarProvider({
	value,
	children,
}: {
	value: CalendarContextValue;
	children: ReactNode;
}): ReactElement {
	return <CalendarContext value={value}>{children}</CalendarContext>;
}
CalendarProvider.displayName = "DelacourUI.Calendar.Provider";

/** The enclosing calendar's state, or null outside a `<Calendar>` — for another folder's control. */
export function useCalendarContext(): CalendarContextValue | null {
	return use(CalendarContext);
}

/**
 * Reads the enclosing calendar's state.
 *
 * For a custom day or header that has to match the calendar it sits in. Throws outside one — use
 * {@link useCalendarContext} where the calendar is optional.
 */
export function useCalendar(): CalendarContextValue {
	const context = useCalendarContext();
	if (!context) {
		throw new Error("useCalendar must be called inside a <Calendar>.");
	}
	return context;
}

/**
 * The enclosing calendar's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useCalendarPart(component: string): CalendarContextValue {
	const context = useCalendarContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Calendar>.`);
	}
	return context;
}
