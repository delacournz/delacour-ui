import type { VariantProps } from "tailwind-variants";
import { cn } from "../../lib/cn";
import { tv } from "../../lib/tv";
import {
	type CalendarDate,
	type CalendarDateRange,
	type CalendarSelectionState,
	formatDate,
	formatDateRange,
} from "../calendar/calendar.date";
import type { CalendarMessages } from "../calendar/calendar.types";
import {
	INPUT_DECORATOR_ICON_TOKEN,
	INPUT_INVALID_DECORATOR_ICON_TOKEN,
	type InputSize,
	type InputVariant,
	inputVariants,
} from "../input/input.variants";

/** The three selection modes — the same three a `Calendar` has. */
export const DATE_PICKER_MODES = ["single", "range", "multiple"] as const;
export type DatePickerMode = (typeof DATE_PICKER_MODES)[number];

/** Where the calendar appears: in a bottom sheet over the app, or in place on the screen. */
export const DATE_PICKER_PRESENTATIONS = ["sheet", "inline"] as const;
export type DatePickerPresentation = (typeof DATE_PICKER_PRESENTATIONS)[number];

/** Optional text and sentence formatters for a date picker. */
export type DatePickerMessages = Partial<{
	accessibilityLabel: string;
	triggerHint: string;
	placeholderSingle: string;
	placeholderRange: string;
	placeholderMultiple: string;
	rangeEnd: string;
	title: string;
	done: string;
	clear: string;
	close: string;
	notSet: string;
	fromDateNoEnd: (date: string) => string;
	rangeValue: (start: string, end: string) => string;
	multipleValues: (dates: readonly string[]) => string;
	multipleCount: (count: number) => string;
	selected: (value: string) => string;
}> & { calendar?: CalendarMessages };

export type ResolvedDatePickerMessages = Required<Omit<DatePickerMessages, "calendar">> & {
	calendar: CalendarMessages;
};

const DEFAULT_DATE_PICKER_MESSAGES: ResolvedDatePickerMessages = {
	accessibilityLabel: "Date",
	triggerHint: "Opens calendar",
	placeholderSingle: "Select date",
	placeholderRange: "Start – End",
	placeholderMultiple: "Select dates",
	rangeEnd: "End",
	title: "Select date",
	done: "Done",
	clear: "Clear",
	close: "Close",
	notSet: "not set",
	fromDateNoEnd: (date) => `From ${date}, no end chosen`,
	rangeValue: (start, end) => `${start} to ${end}`,
	multipleValues: (dates) => dates.join(", "),
	multipleCount: (count) => `${count} dates`,
	selected: (value) => `Selected ${value}`,
	calendar: {},
};

export function resolveDatePickerMessages(messages: DatePickerMessages = {}): ResolvedDatePickerMessages {
	const overrides = Object.fromEntries(Object.entries(messages).filter(([, value]) => value !== undefined));
	return { ...DEFAULT_DATE_PICKER_MESSAGES, ...overrides, calendar: messages.calendar ?? {} };
}

/** How long a finished pick stays on screen before the sheet closes, so the selection is seen. */
export const DATE_PICKER_CLOSE_DELAY = 120;

/** How many days `multiple` lists on the trigger before it counts them instead. */
export const DATE_PICKER_LISTED_DATES = 2;

/** What a custom day formatter is told besides the day. */
export type DatePickerFormatContext = { locale: string | undefined };

/** Formats one day for the trigger — a single date, or each date of a multiple selection. */
export type DatePickerFormat = (value: CalendarDate, context: DatePickerFormatContext) => string;

/** Formats a whole range for the trigger, half-picked or complete. */
export type DatePickerFormatRange = (range: CalendarDateRange, context: DatePickerFormatContext) => string;

/**
 * Styling for the trigger and the sheet's frame.
 *
 * The trigger's **box** is not here: it is `inputVariants`' `root` slot, read by
 * {@link resolveDatePickerTriggerClass}, so a picker and an `Input` beside it are the same box by
 * construction rather than by two class strings agreeing. What this adds is the row inside the
 * box and the type on the value, both on the input scale.
 *
 * `value` holds the only text colour — AGENTS.md rule 1 — and the placeholder is a variant of it
 * rather than a second slot, so a half-picked range and an empty trigger dim the same way.
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const datePickerVariants = tv({
	slots: {
		trigger: "flex-row items-center",
		value: "flex-1 font-sans text-foreground leading-tight",
		valuePlaceholder: "text-muted-foreground",
		icon: "",
		header: "pb-2",
		body: "items-stretch",
		footer: "flex-row gap-2 pt-4",
	},
	variants: {
		size: {
			sm: { trigger: "gap-1.5", value: "text-input-sm", icon: "size-icon-sm" },
			md: { trigger: "gap-2", value: "text-input-md", icon: "size-icon-md" },
			lg: { trigger: "gap-2.5", value: "text-input-lg", icon: "size-icon-lg" },
		},
		isPlaceholder: { true: { value: "text-muted-foreground" }, false: {} },
		isInvalid: { true: {}, false: {} },
	},
	defaultVariants: { size: "md", isPlaceholder: false, isInvalid: false },
});

export type DatePickerVariantProps = VariantProps<typeof datePickerVariants>;

/** The axes the trigger's box is drawn from. */
export type DatePickerTriggerBox = {
	variant?: InputVariant;
	size?: InputSize;
	isDisabled?: boolean;
	isFocused?: boolean;
	isInvalid?: boolean;
	className?: string;
};

/**
 * The class the trigger wears: the `Input` box, then the row inside it.
 *
 * Reading `inputVariants().root()` rather than restating it is the whole point — the box a picker
 * draws is the box a text field draws, at every size, variant and state, including invalid
 * outranking focus. The test sweeps the matrix and asserts the superset.
 */
export function resolveDatePickerTriggerClass({ className, size = "md", ...box }: DatePickerTriggerBox): string {
	return cn(inputVariants({ ...box, size }).root(), datePickerVariants({ size }).trigger({ className }));
}

/** The calendar glyph's colour token: muted at rest, destructive while invalid — the decorator's pair. */
export function resolveDatePickerIconColor(isInvalid: boolean): string {
	return isInvalid ? INPUT_INVALID_DECORATOR_ICON_TOKEN : INPUT_DECORATOR_ICON_TOKEN;
}

/** What the trigger shows, by state. */
export type DatePickerTriggerState = {
	isFocused: boolean;
	isInvalid: boolean;
	isDisabled: boolean;
	/** Whether a press opens the sheet. Disabled and read-only never do. */
	canOpen: boolean;
};

/**
 * Settles the trigger's state. Open is focus — the sheet holding the calendar is the trigger's
 * editing state — and a disabled trigger is never focused. Invalid outranking focus is the
 * `Input` box's own compound, so nothing restates it here.
 */
export function resolveTriggerState({
	isOpen,
	isInvalid,
	isDisabled,
	isReadOnly,
}: {
	isOpen: boolean;
	isInvalid: boolean;
	isDisabled: boolean;
	isReadOnly: boolean;
}): DatePickerTriggerState {
	return {
		canOpen: !isDisabled && !isReadOnly,
		isDisabled,
		isFocused: isOpen && !isDisabled,
		isInvalid,
	};
}

/** What a picker was given at its own call site. */
export type DatePickerOwnAxes = {
	variant?: InputVariant;
	size?: InputSize;
	isDisabled?: boolean;
	isInvalid?: boolean;
	isReadOnly?: boolean;
};

export type DatePickerAxes = Required<DatePickerOwnAxes>;

/**
 * Settles a picker's axes: its own props, then an enclosing `Field`, then the defaults. `??`
 * throughout, so `isInvalid={false}` opts out of a field's invalid state.
 */
export function resolveDatePickerAxes({
	own,
	field,
}: {
	own?: DatePickerOwnAxes;
	field?: { isDisabled?: boolean; isInvalid?: boolean } | null;
}): DatePickerAxes {
	return {
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
		isReadOnly: own?.isReadOnly ?? false,
		size: own?.size ?? "md",
		variant: own?.variant ?? "primary",
	};
}

/**
 * Whether a selection is finished, so the sheet should close: a picked day, a range with both
 * ends. A `multiple` selection is never finished — the sheet stays until Done.
 */
export function resolveShouldClose(selection: CalendarSelectionState): boolean {
	switch (selection.mode) {
		case "single":
			return selection.value !== null;
		case "range":
			return selection.value.start !== null && selection.value.end !== null;
		case "multiple":
			return false;
	}
}

/** The auto-close delay — none under calm motion, where the pause would read as lag rather than feedback. */
export function resolveCloseDelay(isCalm: boolean): number {
	return isCalm ? 0 : DATE_PICKER_CLOSE_DELAY;
}

/** The mode's own empty selection — what Clear sets. */
export function emptySelection(mode: DatePickerMode): CalendarSelectionState {
	switch (mode) {
		case "single":
			return { mode, value: null };
		case "range":
			return { mode, value: { start: null, end: null } };
		case "multiple":
			return { mode, value: [] };
	}
}

/** Whether anything is selected. A started range counts. */
export function hasSelection(selection: CalendarSelectionState): boolean {
	switch (selection.mode) {
		case "single":
			return selection.value !== null;
		case "range":
			return selection.value.start !== null;
		case "multiple":
			return selection.value.length > 0;
	}
}

/** Clear is offered by default where undoing by hand is tedious: a range or a list, not one day. */
export function resolveIsClearable(mode: DatePickerMode, isClearable: boolean | undefined): boolean {
	return isClearable ?? mode !== "single";
}

/** The placeholder a mode shows when the caller names none. */
export function resolveDefaultPlaceholder(mode: DatePickerMode): string {
	return resolveMessagePlaceholder(mode, DEFAULT_DATE_PICKER_MESSAGES);
}

export function resolveMessagePlaceholder(mode: DatePickerMode, messages: ResolvedDatePickerMessages): string {
	switch (mode) {
		case "single":
			return messages.placeholderSingle;
		case "range":
			return messages.placeholderRange;
		case "multiple":
			return messages.placeholderMultiple;
	}
}

export type FormatSelectionOptions = {
	locale?: string;
	format?: DatePickerFormat;
	formatRange?: DatePickerFormatRange;
	messages?: ResolvedDatePickerMessages;
};

/** The range branch of {@link formatSelection}: a custom range format, then a day format, then `formatDateRange`. */
function formatRangeSelection(
	range: CalendarDateRange,
	{ day, format, formatRange, locale }: FormatSelectionOptions & { day: (date: CalendarDate) => string }
): string | undefined {
	if (!range.start) return undefined;
	if (formatRange) return formatRange(range, { locale });
	if (format) return range.end ? `${day(range.start)} – ${day(range.end)}` : `${day(range.start)} –`;
	return formatDateRange(range, { locale, style: "medium" });
}

/**
 * The trigger's text for a selection, or `undefined` for none — the placeholder's cue.
 *
 * Every date is formatted by `calendar.date`, never here: a single day in the medium style, a
 * range through `formatDateRange` (which collapses what the two ends share and ends a half-picked
 * range on an en dash), a list as up to two days and then a count. `format` replaces the day
 * formatter everywhere, and `formatRange` replaces the whole range.
 */
export function formatSelection(
	selection: CalendarSelectionState,
	{ locale, format, formatRange, messages = DEFAULT_DATE_PICKER_MESSAGES }: FormatSelectionOptions = {}
): string | undefined {
	const context: DatePickerFormatContext = { locale };
	const day = (date: CalendarDate): string => format?.(date, context) ?? formatDate(date, { locale, style: "medium" });

	switch (selection.mode) {
		case "single":
			return selection.value ? day(selection.value) : undefined;
		case "range":
			return formatRangeSelection(selection.value, { day, format, formatRange, locale });
		case "multiple": {
			const dates = selection.value;
			if (dates.length === 0) return undefined;
			if (dates.length > DATE_PICKER_LISTED_DATES) return messages.multipleCount(dates.length);
			return messages.multipleValues(dates.map(day));
		}
	}
}

/**
 * What a screen reader hears as the trigger's value: full month names, "to" rather than a dash
 * (which VoiceOver reads as "minus" or skips), and "not set" rather than silence.
 */
export function resolveSelectionAccessibilityValue(
	selection: CalendarSelectionState,
	locale?: string,
	messages: ResolvedDatePickerMessages = DEFAULT_DATE_PICKER_MESSAGES
): string {
	const long = (date: CalendarDate): string => formatDate(date, { locale, style: "long" });

	switch (selection.mode) {
		case "single":
			return selection.value ? long(selection.value) : messages.notSet;
		case "range": {
			const { start, end } = selection.value;
			if (!start) return messages.notSet;
			if (!end) return messages.fromDateNoEnd(long(start));
			return messages.rangeValue(long(start), long(end));
		}
		case "multiple": {
			const dates = selection.value;
			if (dates.length === 0) return messages.notSet;
			if (dates.length > DATE_PICKER_LISTED_DATES) return messages.multipleCount(dates.length);
			return messages.multipleValues(dates.map(long));
		}
	}
}

/** What is announced when the sheet closes on a finished pick. */
export function resolveAnnouncement(
	selection: CalendarSelectionState,
	locale?: string,
	messages: ResolvedDatePickerMessages = DEFAULT_DATE_PICKER_MESSAGES
): string {
	return messages.selected(resolveSelectionAccessibilityValue(selection, locale, messages));
}
