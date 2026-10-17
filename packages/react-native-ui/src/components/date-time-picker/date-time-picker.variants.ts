import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { formatTime, type HourCycle } from "../time-picker/time-picker.time";
import { TIME_PICKER_DEFAULT_VISIBLE_ROWS, TIME_PICKER_ROW_HEIGHTS } from "../time-picker/time-picker.variants";
import { type DateTimeValue, formatDateTime, formatDateTimeLong } from "./date-time-picker.value";

/** How the two halves share the panel: one at a time behind tabs, or both on screen at once. */
export const DATE_TIME_PICKER_LAYOUTS = ["tabs", "stacked"] as const;
export type DateTimePickerLayout = (typeof DATE_TIME_PICKER_LAYOUTS)[number];

/** Where the panel appears: in a bottom sheet behind a trigger, or in place on the screen. */
export const DATE_TIME_PICKER_PRESENTATIONS = ["sheet", "inline"] as const;
export type DateTimePickerPresentation = (typeof DATE_TIME_PICKER_PRESENTATIONS)[number];

/** The two halves — the tabs a `tabs` layout switches between. */
export const DATE_TIME_PICKER_SECTIONS = ["date", "time"] as const;
export type DateTimePickerSection = (typeof DATE_TIME_PICKER_SECTIONS)[number];

/** Every word the picker shows or speaks when the caller names none. */
export const DATE_TIME_PICKER_DEFAULTS = {
	accessibilityLabel: "Date and time",
	clearLabel: "Clear",
	dateLabel: "Date",
	doneLabel: "Done",
	placeholder: "Select date and time",
	timeLabel: "Time",
	title: "Select date and time",
} as const;

/** How long the stacked layout's wheel takes to fade in or out, in milliseconds. */
export const DATE_TIME_PICKER_EXPAND_DURATION = 220;

/**
 * The height the stacked layout's wheel opens to: the `md` wheel's own, rows times row height.
 *
 * Known up front rather than measured, so the expansion is one committed style the sheet's own
 * layout measurement sees — the wheel is always `md` inside the panel, whatever the trigger's size.
 */
export const DATE_TIME_PICKER_WHEEL_HEIGHT = TIME_PICKER_ROW_HEIGHTS.md * TIME_PICKER_DEFAULT_VISIBLE_ROWS;

/** Formats the trigger's text. Gets the resolved locale and hour cycle, never `"auto"`. */
export type DateTimePickerFormat = (value: DateTimeValue, context: { locale: string; hourCycle: HourCycle }) => string;

/**
 * Styling for the panel the trigger opens.
 *
 * The trigger is not here: it is `date-picker.variants`' — itself `Input`'s box — read by the
 * trigger parts, so a date-and-time field and a date field beside it are one box by construction.
 *
 * Text colour sits on `timeLabel` and `timeValue` only, the two `Text` slots; every other slot is
 * worn by a view, which does not cascade colour (package rule 1). The placeholder and the open
 * row are variants of `timeValue` rather than slots of their own.
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const dateTimePickerVariants = tv({
	slots: {
		content: "items-stretch",
		tabs: "gap-3",
		panel: "items-stretch",
		divider: "my-2",
		timeRow: "min-h-input-md flex-row items-center justify-between gap-3 rounded-md px-1",
		timeLabel: "font-sans font-medium text-foreground text-input-md",
		timeValue: "font-sans text-foreground text-input-md tabular-nums",
		timeWheel: "overflow-hidden",
		footer: "flex-row gap-3",
		/** The inline panel's card — the frame a sheet would otherwise give it. */
		inline: "rounded-lg border border-border bg-card p-3",
	},
	variants: {
		layout: {
			tabs: { panel: "pt-3" },
			stacked: { content: "gap-1" },
		},
		// The empty `false` branches are load-bearing typing — see input.variants.ts.
		isPlaceholder: { true: { timeValue: "text-muted-foreground" }, false: {} },
		isExpanded: { true: { timeValue: "text-primary" }, false: {} },
		/** Inert everywhere, including inline. A disabled trigger fades through `Input`'s own box instead. */
		isDisabled: { true: { content: "opacity-50" }, false: {} },
	},
	defaultVariants: { layout: "tabs", isPlaceholder: false, isExpanded: false, isDisabled: false },
});

export type DateTimePickerVariantProps = VariantProps<typeof dateTimePickerVariants>;

/** The stacked wheel's fade — none under calm motion, where it should simply appear. */
export function resolveExpandDuration(isCalm: boolean): number {
	return isCalm ? 0 : DATE_TIME_PICKER_EXPAND_DURATION;
}

/**
 * Whether a date pick should move the `tabs` layout on to Time: only when the value was empty —
 * its time was just guessed from the clock, so the person has not chosen one yet — and only once
 * per opening, so going back to Date to change the day is not undone by a tab jumping away.
 */
export function resolveShouldAutoAdvance({
	layout,
	hadValue,
	hasAdvanced,
}: {
	layout: DateTimePickerLayout;
	hadValue: boolean;
	hasAdvanced: boolean;
}): boolean {
	return layout === "tabs" && !hadValue && !hasAdvanced;
}

export type DateTimeDisplayOptions = {
	locale: string;
	hourCycle: HourCycle;
	format?: DateTimePickerFormat;
};

/** The trigger's text, or `undefined` while nothing is set — the placeholder's cue. `format` wins. */
export function resolveDateTimeDisplay(
	value: DateTimeValue | null,
	{ locale, hourCycle, format }: DateTimeDisplayOptions
): string | undefined {
	if (!value) return undefined;
	return format ? format(value, { hourCycle, locale }) : formatDateTime(value, { hourCycle, locale });
}

/** The time row's readout — the time alone, or an en dash while nothing is set. */
export function resolveTimeReadout(
	value: DateTimeValue | null,
	context: { locale: string; hourCycle: HourCycle }
): string {
	return value ? formatTime(value.time, context) : "–";
}

/** What a screen reader hears as the trigger's value: every word, or "not set" rather than silence. */
export function resolveDateTimeAccessibilityValue(
	value: DateTimeValue | null,
	context: { locale: string; hourCycle: HourCycle }
): string {
	return value ? formatDateTimeLong(value, context) : "not set";
}

/** What Done announces: the composed value, so a VoiceOver user hears what the sheet decided. */
export function resolveDateTimeAnnouncement(
	value: DateTimeValue | null,
	context: { locale: string; hourCycle: HourCycle }
): string {
	return value ? `Selected ${formatDateTimeLong(value, context)}` : "No date and time selected";
}
