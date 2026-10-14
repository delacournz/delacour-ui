import type { VariantProps } from "tailwind-variants";
import { cn } from "../../lib/cn";
import { tv } from "../../lib/tv";
import { type InputBoxState, type InputSize, inputVariants } from "../input/input.variants";
import {
	type DayPeriod,
	type HourCycle,
	isTimeDisabled,
	minutesForHour,
	type TimeBounds,
	type TimeValue,
	to12Hour,
	to24Hour,
} from "./time-picker.time";

/** How the picker presents its wheel: in a bottom sheet behind a trigger, or on the screen itself. */
export const TIME_PICKER_PRESENTATIONS = ["sheet", "inline"] as const;

export type TimePickerPresentation = (typeof TIME_PICKER_PRESENTATIONS)[number];

/** The faces the picker may draw. Only the wheel ships; the axis is reserved for a dial and a ruler. */
export const TIME_PICKER_LAYOUTS = ["wheel"] as const;

export type TimePickerLayout = (typeof TIME_PICKER_LAYOUTS)[number];

/** How many rows a wheel shows. Odd, so one row sits on the centre line. */
export const TIME_PICKER_VISIBLE_ROWS = [3, 5, 7] as const;

export type TimePickerVisibleRows = (typeof TIME_PICKER_VISIBLE_ROWS)[number];

export const TIME_PICKER_DEFAULT_VISIBLE_ROWS: TimePickerVisibleRows = 5;

/**
 * A wheel row's height in points, per size.
 *
 * A number rather than a class because the scroll view snaps to it —
 * `snapToInterval` takes points, and the centre-index maths divides by it.
 */
export const TIME_PICKER_ROW_HEIGHTS: Record<InputSize, number> = { sm: 32, md: 40, lg: 48 };

/**
 * Styling for every part of a time picker.
 *
 * The trigger has no box of its own: {@link resolveTimePickerTriggerClass}
 * lays `inputVariants`' `root` slot under it, so a picker beside an `Input` is
 * the same height, border and corner by construction.
 *
 * Text colour sits on the text slots only — `value`, `rowText`, `separator`.
 * The rest are worn by views, which do not cascade colour (package rule 1).
 *
 * The wheel draws no gradient fade. A row's opacity and scale come from its
 * distance to the centre line, computed per frame on the UI thread
 * ({@link resolveWheelRowAppearance}), which fades the edges without touching
 * a gradient peer and lets calm motion turn the flourish off in one place.
 */
export const timePickerVariants = tv({
	slots: {
		trigger: "flex-row items-center gap-2",
		value: "flex-1 font-sans text-foreground leading-tight",
		icon: "",
		wheel: "flex-row items-stretch justify-center gap-1",
		column: "flex-1 overflow-hidden",
		row: "items-center justify-center",
		rowText: "font-sans text-foreground",
		selectionBand: "absolute inset-x-0 rounded-lg bg-muted",
		separator: "self-center font-sans font-medium text-foreground",
		/** The sheet title. No close control sits beside it, so the clearance `BottomSheet.Title` reserves is given back. */
		header: "pr-0",
		footer: "flex-row gap-3",
	},
	variants: {
		size: {
			sm: { value: "text-input-sm", icon: "size-icon-sm", rowText: "text-input-sm", separator: "text-input-sm" },
			md: { value: "text-input-md", icon: "size-icon-md", rowText: "text-input-md", separator: "text-input-md" },
			lg: { value: "text-input-lg", icon: "size-icon-lg", rowText: "text-input-lg", separator: "text-input-lg" },
		},
		// The empty `false` branches are load-bearing typing — see input.variants.ts.
		isPlaceholder: { true: { value: "text-muted-foreground" }, false: {} },
		isSelected: { true: { rowText: "font-semibold" }, false: {} },
		isRowDisabled: { true: { rowText: "text-muted-foreground opacity-50" }, false: {} },
		/** The whole wheel, inert. A disabled trigger fades through `Input`'s own box instead. */
		isDisabled: { true: { wheel: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		size: "md",
		isPlaceholder: false,
		isSelected: false,
		isRowDisabled: false,
		isDisabled: false,
	},
});

export type TimePickerVariantProps = VariantProps<typeof timePickerVariants>;

/**
 * The class the trigger wears: `Input`'s box, laid out as a row for the value
 * and the icon.
 *
 * Reads the `root` slot alone, never `resolveInputFieldClass`, because that
 * adds the field's text classes and the trigger is a view. The value's type
 * scale comes from this file's `value` slot instead, which names the same
 * `text-input-*` token.
 *
 * Pure, so the whole matrix is reachable from `bun test`.
 */
export function resolveTimePickerTriggerClass({
	className,
	...state
}: Pick<InputBoxState, "variant" | "size" | "isDisabled" | "isFocused" | "isInvalid"> & {
	className?: string;
}): string {
	return cn(inputVariants(state).root(), timePickerVariants({ size: state.size }).trigger(), className);
}

/** Space above the first row and below the last, so either can reach the centre line. */
export function resolveWheelPadding(rowHeight: number, visibleRows: number): number {
	return (rowHeight * (visibleRows - 1)) / 2;
}

/** The row on the centre line at a scroll offset, clamped to the column. */
export function offsetToIndex(offset: number, rowHeight: number, count: number): number {
	"worklet";
	if (rowHeight <= 0 || count <= 0) return 0;
	const index = Math.round(offset / rowHeight);
	return Math.min(Math.max(index, 0), count - 1);
}

/** The scroll offset that puts a row on the centre line. */
export function indexToOffset(index: number, rowHeight: number): number {
	"worklet";
	return index * rowHeight;
}

/**
 * The enabled row closest to `index`, or -1 when every row is disabled.
 * Ties go forward — later in the day — since a dimmed row is usually one the
 * minimum has just ruled out.
 */
export function nearestEnabledIndex(index: number, disabled: readonly boolean[]): number {
	"worklet";
	if (index >= 0 && index < disabled.length && !disabled[index]) return index;
	for (let distance = 1; distance < disabled.length; distance++) {
		const after = index + distance;
		if (after < disabled.length && after >= 0 && !disabled[after]) return after;
		const before = index - distance;
		if (before >= 0 && before < disabled.length && !disabled[before]) return before;
	}
	return -1;
}

const ROW_OPACITY_PER_ROW = 0.3;
const ROW_OPACITY_FLOOR = 0.2;
const ROW_SCALE_PER_ROW = 0.06;
const ROW_SCALE_FLOOR = 0.82;

/**
 * How a row draws at `distance` rows from the centre line: whole on the line,
 * fading and shrinking away from it, never below a floor.
 *
 * Under calm motion the scale stays at 1 and the opacity steps by whole rows,
 * so nothing moves in proportion to the finger beyond the scroll itself.
 */
export function resolveWheelRowAppearance(distance: number, isCalm: boolean): { opacity: number; scale: number } {
	"worklet";
	const away = Math.abs(distance);
	if (isCalm) {
		return { opacity: Math.max(ROW_OPACITY_FLOOR, 1 - ROW_OPACITY_PER_ROW * Math.round(away)), scale: 1 };
	}
	return {
		opacity: Math.max(ROW_OPACITY_FLOOR, 1 - ROW_OPACITY_PER_ROW * away),
		scale: Math.max(ROW_SCALE_FLOOR, 1 - ROW_SCALE_PER_ROW * away),
	};
}

/** Which field a wheel column sets. */
export type TimeWheelColumnKind = "hour" | "minute" | "second" | "period";

/** One row of a wheel column. `value` is what the column writes: a stored hour, a minute, or 0/1 for the period. */
export type TimeWheelRow = { key: string; label: string; value: number; isDisabled: boolean };

export type TimeWheelColumnModel = { kind: TimeWheelColumnKind; rows: TimeWheelRow[]; selectedIndex: number };

export type TimeWheelColumnsInput = {
	/** The time the wheels show. */
	time: TimeValue;
	hourCycle: HourCycle;
	minuteStep: number;
	showSeconds: boolean;
	bounds: TimeBounds;
	/** The locale's words for before and after noon. */
	periodLabels: Record<DayPeriod, string>;
};

const PERIODS: readonly DayPeriod[] = ["am", "pm"];

const pad = (value: number) => String(value).padStart(2, "0");

/** The index of the row whose value is closest to `value`. */
function closestIndex(rows: readonly TimeWheelRow[], value: number): number {
	let best = 0;
	for (let index = 1; index < rows.length; index++) {
		if (Math.abs(rows[index].value - value) < Math.abs(rows[best].value - value)) best = index;
	}
	return best;
}

/**
 * The columns the wheel draws for a time, with their rows, which rows are out
 * of bounds, and which row each column centres.
 *
 * On a 12-hour clock the hour column holds the twelve hours of the *current*
 * period — 12, 1 … 11 — and each row carries its stored hour, so moving the
 * hour wheel never flips AM and PM. The period column is two rows.
 *
 * Pure: every rule the wheel follows is reachable from `bun test`.
 */
export function resolveTimeWheelColumns({
	time,
	hourCycle,
	minuteStep,
	showSeconds,
	bounds,
	periodLabels,
}: TimeWheelColumnsInput): TimeWheelColumnModel[] {
	const period = to12Hour(time.hour).period;
	const hourHasMinutes = (hour: number) => minutesForHour(hour, minuteStep, bounds).length > 0;

	const hourRows: TimeWheelRow[] =
		hourCycle === 24
			? Array.from({ length: 24 }, (_, hour) => ({
					key: `h${hour}`,
					label: pad(hour),
					value: hour,
					isDisabled: !hourHasMinutes(hour),
				}))
			: [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour12) => {
					const hour = to24Hour(hour12, period);
					return { key: `h${hour}`, label: String(hour12), value: hour, isDisabled: !hourHasMinutes(hour) };
				});

	const enabledMinutes = new Set(minutesForHour(time.hour, minuteStep, bounds));
	const minuteRows: TimeWheelRow[] = [];
	for (let minute = 0; minute < 60; minute += minuteStep) {
		minuteRows.push({ key: `m${minute}`, label: pad(minute), value: minute, isDisabled: !enabledMinutes.has(minute) });
	}

	const columns: TimeWheelColumnModel[] = [
		{ kind: "hour", rows: hourRows, selectedIndex: closestIndex(hourRows, time.hour) },
		{ kind: "minute", rows: minuteRows, selectedIndex: closestIndex(minuteRows, time.minute) },
	];

	if (showSeconds) {
		const secondRows = Array.from({ length: 60 }, (_, second) => ({
			key: `s${second}`,
			label: pad(second),
			value: second,
			isDisabled: isTimeDisabled({ hour: time.hour, minute: time.minute, second }, bounds),
		}));
		columns.push({ kind: "second", rows: secondRows, selectedIndex: closestIndex(secondRows, time.second ?? 0) });
	}

	if (hourCycle === 12) {
		const periodRows = PERIODS.map((entry, index) => {
			const first = entry === "am" ? 0 : 12;
			const hasHour = Array.from({ length: 12 }, (_, offset) => first + offset).some(hourHasMinutes);
			return { key: entry, label: periodLabels[entry], value: index, isDisabled: !hasHour };
		});
		columns.push({ kind: "period", rows: periodRows, selectedIndex: PERIODS.indexOf(period) });
	}

	return columns;
}

/**
 * The time a column proposes when it settles on a row — before it is pulled
 * back onto the step and inside the bounds.
 */
export function resolveTimeFromColumn(time: TimeValue, kind: TimeWheelColumnKind, value: number): TimeValue {
	switch (kind) {
		case "hour":
			return { ...time, hour: value };
		case "minute":
			return { ...time, minute: value };
		case "second":
			return { ...time, second: value };
		case "period": {
			const period = PERIODS[value] ?? "am";
			return { ...time, hour: to24Hour(to12Hour(time.hour).hour12, period) };
		}
	}
}

/**
 * What a screen reader speaks for a column's value. The column, not the row,
 * is the accessible element, so this is the whole of what it hears.
 */
export function resolveColumnAccessibilityValue(kind: TimeWheelColumnKind, label: string): string {
	switch (kind) {
		case "hour":
			return `${Number(label)} o'clock`;
		case "minute": {
			const minutes = Number(label);
			return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
		}
		case "second": {
			const seconds = Number(label);
			return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
		}
		case "period":
			return label;
	}
}

/** The name a screen reader speaks for each column. */
export const TIME_WHEEL_COLUMN_LABELS: Record<TimeWheelColumnKind, string> = {
	hour: "Hour",
	minute: "Minute",
	second: "Second",
	period: "AM or PM",
};
