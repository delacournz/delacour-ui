import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { CalendarDate, CalendarDateRange, DateMatcher, Weekday } from "../calendar/calendar.date";
import type { CalendarCaptionLayout } from "../calendar/calendar.types";
import type { CalendarSize } from "../calendar/calendar.variants";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { DatePickerFormat, DatePickerFormatRange, DatePickerPresentation } from "./date-picker.variants";

/**
 * What a picker holds, and the value it reports — one shape per mode.
 *
 * `mode` is the discriminant, so `value` and `onValueChange` are typed for the mode named. Omitted,
 * it is `single`; a range or a list has to say so.
 */
export type DatePickerSelectionProps =
	| {
			mode?: "single";
			/** Controlled day. `null` is none. */
			value?: CalendarDate | null;
			/** Starting day while uncontrolled. */
			defaultValue?: CalendarDate | null;
			/** Fires when a day is picked, and with `null` on Clear. */
			onValueChange?: (value: CalendarDate | null) => void;
	  }
	| {
			mode: "range";
			value?: CalendarDateRange;
			defaultValue?: CalendarDateRange;
			/**
			 * Fires once a range is complete, and with an empty range on Clear. A half-picked range is
			 * held inside the sheet and never reported.
			 */
			onValueChange?: (value: CalendarDateRange) => void;
	  }
	| {
			mode: "multiple";
			value?: readonly CalendarDate[];
			defaultValue?: readonly CalendarDate[];
			/** Fires on every toggle, sorted earliest first. */
			onValueChange?: (value: readonly CalendarDate[]) => void;
	  };

export type DatePickerProps = Omit<ViewProps, "children"> &
	DatePickerSelectionProps & {
		/** Shown while nothing is picked. Omitted, one per mode: "Select date", "Start – End", "Select dates". */
		placeholder?: string;
		/** Formats a day on the trigger — a single date, or each of several. */
		format?: DatePickerFormat;
		/** Formats a whole range on the trigger, half-picked or complete. */
		formatRange?: DatePickerFormatRange;
		/** A BCP 47 tag for the trigger text and the calendar. Omitted, the device's. */
		locale?: string;
		/** The calendar's first column. `auto` reads it from the locale. */
		weekStartsOn?: Weekday | "auto";
		/** `picker` makes the calendar's caption open the month and year views. */
		captionLayout?: CalendarCaptionLayout;
		/** The earliest day that can be picked, inclusive. */
		minDate?: CalendarDate;
		/** The latest day that can be picked, inclusive. */
		maxDate?: CalendarDate;
		/** Further days that cannot be picked. */
		disabledDates?: readonly DateMatcher[];
		/** Lets a neighbouring month's day be picked. */
		selectOutsideDays?: boolean;
		/** Overrides today on the calendar — for a demo, a screenshot or a test. */
		today?: CalendarDate;
		/** `sheet` opens a bottom sheet from a trigger; `inline` draws the calendar in place. */
		presentation?: DatePickerPresentation;
		/** Controlled open state of the sheet. */
		isOpen?: boolean;
		/** Starting open state while uncontrolled. */
		defaultOpen?: boolean;
		onOpenChange?: (isOpen: boolean) => void;
		/**
		 * The sheet has finished closing, by any path. `onOpenChange(false)` fires as the close
		 * starts; this fires once the sheet is all the way down, so focus can move on without
		 * racing the slide. Never called inline.
		 */
		onClose?: () => void;
		/** Inert and faded; never opens. Inherited from an enclosing `Field`. */
		isDisabled?: boolean;
		/** Shows the value and never opens. */
		isReadOnly?: boolean;
		/** A destructive border and glyph. Inherited from an enclosing `Field`. */
		isInvalid?: boolean;
		/** The trigger's box, on the `Input` axes. */
		variant?: InputVariant;
		/** The trigger's box and type, on the `Input` scale. */
		size?: InputSize;
		/** The calendar's cell size — independent of the trigger, so day targets stay 44pt. */
		calendarSize?: CalendarSize;
		/** The sheet's title. */
		title?: string;
		/** Done's label. */
		doneLabel?: string;
		/** Clear's label. */
		clearLabel?: string;
		/** Offers Clear. Omitted, on for a range or several days and off for one. */
		isClearable?: boolean;
		/** The trigger's accessible name. Omitted, the enclosing `Field.Label`'s text, else "Date". */
		accessibilityLabel?: string;
		className?: string;
		/** A custom anatomy. Omitted, the trigger and the sheet — or, inline, the calendar. */
		children?: ReactNode;
	};
