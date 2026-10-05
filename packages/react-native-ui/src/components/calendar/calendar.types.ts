import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { CalendarDate, CalendarDateRange, DateMatcher, Weekday } from "./calendar.date";
import type { CalendarSize, CalendarVariant } from "./calendar.variants";

/**
 * What a calendar selects, and the value it reports — one shape per mode.
 *
 * `mode` is the discriminant, so `selected` and `onSelect` are typed for the mode named: a range
 * calendar cannot be handed a single date. Omitted, it is `single`.
 */
export type CalendarSelection =
	| {
			mode?: "single";
			/** Controlled selection. `null` is no day. */
			selected?: CalendarDate | null;
			/** Starting selection while uncontrolled. */
			defaultSelected?: CalendarDate | null;
			/** Fires on every change. A tap on the selected day clears it to `null`. */
			onSelect?: (value: CalendarDate | null) => void;
	  }
	| {
			mode: "multiple";
			selected?: readonly CalendarDate[];
			defaultSelected?: readonly CalendarDate[];
			/** Fires on every change, sorted earliest first. */
			onSelect?: (value: readonly CalendarDate[]) => void;
	  }
	| {
			mode: "range";
			selected?: CalendarDateRange;
			defaultSelected?: CalendarDateRange;
			/** Fires on both taps — once with only a start, once complete. */
			onSelect?: (value: CalendarDateRange) => void;
	  };

/** What a month's caption is: a plain label, or a button that opens the month and year views. */
export type CalendarCaptionLayout = "label" | "picker";

export type CalendarProps = Omit<ViewProps, "children"> &
	CalendarSelection & {
		/** `primary` fills the selected day; `secondary` softens it. */
		variant?: CalendarVariant;
		/** The cell height and the number's size, on the input scale. */
		size?: CalendarSize;
		/** The earliest day that can be picked, inclusive. */
		minDate?: CalendarDate;
		/** The latest day that can be picked, inclusive. */
		maxDate?: CalendarDate;
		/** Further days that cannot be picked. A day any matcher matches is disabled. */
		disabled?: readonly DateMatcher[];
		/** Inert and faded. Inherited from an enclosing `Field`. */
		isDisabled?: boolean;
		/** Tints the selection destructive. Inherited from an enclosing `Field`. */
		isInvalid?: boolean;
		/** The selection is shown and cannot be changed. Paging still works. */
		isReadOnly?: boolean;
		/** Controlled visible month. The day is ignored. */
		month?: CalendarDate;
		/** Starting month while uncontrolled. Omitted, the selection's month, else today's. */
		defaultMonth?: CalendarDate;
		/** Fires with the first of the month whenever the visible month changes. */
		onMonthChange?: (month: CalendarDate) => void;
		/** The earliest month paging and the jump views reach. Omitted, `minDate`'s month. */
		startMonth?: CalendarDate;
		/** The latest month paging and the jump views reach. Omitted, `maxDate`'s month. */
		endMonth?: CalendarDate;
		/** A BCP 47 tag for the names and the week start. Omitted, the device's. */
		locale?: string;
		/** The first column's weekday. `auto` reads it from the locale. */
		weekStartsOn?: Weekday | "auto";
		/** `picker` makes the caption open the month and year views. */
		captionLayout?: CalendarCaptionLayout;
		/** Draws the neighbouring months' days in the leading and trailing cells. */
		showOutsideDays?: boolean;
		/** Lets an outside day be picked, paging to its month. */
		selectOutsideDays?: boolean;
		/** Draws the calendar on a `Surface` card. Off, it sits bare — the way a sheet embeds it. */
		isBordered?: boolean;
		/** A horizontal swipe on the grid pages the month. */
		swipeToPage?: boolean;
		/** Overrides today — for a demo, a screenshot or a test. */
		today?: CalendarDate;
		className?: string;
		/** A custom anatomy. Omitted, the header, the weekday row and the grid. */
		children?: ReactNode;
	};
