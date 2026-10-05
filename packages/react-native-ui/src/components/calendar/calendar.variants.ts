import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import {
	type CalendarCell,
	type CalendarDate,
	type CalendarDateRange,
	type CalendarSelectionState,
	compareDates,
	isBetween,
	isSameDay,
	startOfMonth,
} from "./calendar.date";

export const CALENDAR_VARIANTS = ["primary", "secondary"] as const;
export const CALENDAR_SIZES = ["sm", "md", "lg"] as const;

/** How a day is painted: unselected, a filled selection, or the soft band between a range's ends. */
export const CALENDAR_DAY_TONES = ["plain", "selected", "band"] as const;

/** Where a day sits in a range. `none` is outside it — `tv` cannot key a variant on `null`. */
export const CALENDAR_RANGE_ROLES = ["none", "start", "middle", "end", "only"] as const;

export type CalendarVariant = (typeof CALENDAR_VARIANTS)[number];
export type CalendarSize = (typeof CALENDAR_SIZES)[number];
export type CalendarDayTone = (typeof CALENDAR_DAY_TONES)[number];
export type CalendarRangeRole = Exclude<(typeof CALENDAR_RANGE_ROLES)[number], "none">;

/** The view the calendar's body shows: the month grid, or one of the two jump views. */
export type CalendarView = "days" | "months" | "years";

export const CALENDAR_DEFAULT_VARIANT: CalendarVariant = "primary";
export const CALENDAR_DEFAULT_SIZE: CalendarSize = "md";

/**
 * How far a swipe must travel, as a fraction of the grid's width, to page.
 *
 * A quarter rather than a half because a thumb sweeping across a phone rarely covers half the
 * screen, and a fast flick pages regardless — see {@link CALENDAR_PAGE_VELOCITY}.
 */
export const CALENDAR_PAGE_THRESHOLD = 0.25;

/** A release faster than this, in points per second, pages however short the swipe was. */
export const CALENDAR_PAGE_VELOCITY = 500;

/**
 * Styling for every part of a calendar.
 *
 * One slotted `tv()` because eight part files read the same `size` and `variant`, and none of them
 * can import the root without closing a cycle (AGENTS.md rule 3).
 *
 * **A day is three layers.** `cell` is the flex-1 column share and the touch target's height;
 * `band` is drawn behind, edge to edge, for a day inside a range; `dayBase` is the circle that
 * fills for a selection and rings for today, and `dayLabel` is the number. The band spans the
 * whole cell so neighbouring days join into one continuous strip — a gap between columns would
 * break it into beads.
 *
 * **The band is rounded at the range's two ends only.** Start rounds its left, end its right, a
 * one-day range both, and every day between is square — including at a week's edge, where the
 * strip simply stops and picks up again on the next row.
 *
 * **The cell steps on the input scale** — `h-input-*` and `text-input-*` — so a calendar inline
 * beside a field shares its density, and a retune of the field retunes the calendar.
 *
 * **Colour is on the text slots, never their parent** (rule 1): `dayLabel`, `weekdayLabel`,
 * `captionText` and `pickerItemLabel` carry it; every `View` slot carries a fill at most.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const calendarVariants = tv({
	slots: {
		/** The column holding the header, the weekday row and the grid. */
		root: "w-full gap-1",
		/** Previous arrow, caption, next arrow. */
		header: "flex-row items-center justify-between gap-1",
		/** The caption's touch target — a capsule when it opens the jump view. */
		caption: "min-h-11 flex-row items-center justify-center gap-1 rounded-full px-3",
		/** The month and year. */
		captionText: "font-sans font-semibold text-foreground",
		/** The row of weekday names. */
		weekdays: "flex-row",
		/** One weekday name's column. */
		weekday: "flex-1 items-center justify-center py-1",
		/** A weekday name. */
		weekdayLabel: "font-medium font-sans text-muted-foreground text-xs",
		/** The six weeks, clipped so a page sliding in or out never draws past the edge. */
		grid: "overflow-hidden",
		/** One week. */
		week: "flex-row",
		/** One day's column share, and the height of its touch target. */
		cell: "flex-1 items-center justify-center",
		/** The strip behind a day inside a range. */
		band: "absolute inset-0",
		/** The circle a selection fills and today rings. */
		dayBase: "items-center justify-center rounded-full border border-transparent",
		/** The day's number. */
		dayLabel: "font-sans tabular-nums",
		/** The months or years jump view. */
		pickerGrid: "flex-row flex-wrap",
		/** One month or year. */
		pickerItem: "basis-1/3 items-center justify-center rounded-full",
		/** A month or year's name. */
		pickerItemLabel: "font-sans",
	},
	variants: {
		variant: {
			primary: {},
			secondary: {},
		},
		size: {
			sm: {
				captionText: "text-input-sm",
				cell: "h-input-sm",
				dayBase: "size-input-sm",
				dayLabel: "text-input-sm",
				pickerItem: "h-input-sm",
				pickerItemLabel: "text-input-sm",
			},
			md: {
				captionText: "text-input-md",
				cell: "h-input-md",
				dayBase: "size-input-md",
				dayLabel: "text-input-md",
				pickerItem: "h-input-md",
				pickerItemLabel: "text-input-md",
			},
			lg: {
				captionText: "text-input-lg",
				cell: "h-input-lg",
				dayBase: "size-input-lg",
				dayLabel: "text-input-lg",
				pickerItem: "h-input-lg",
				pickerItemLabel: "text-input-lg",
			},
		},
		tone: {
			plain: { dayLabel: "text-foreground", pickerItemLabel: "text-foreground" },
			selected: { dayLabel: "font-semibold", pickerItemLabel: "font-semibold" },
			band: { dayBase: "bg-transparent" },
		},
		rangeRole: {
			none: { band: "hidden" },
			start: { band: "rounded-l-full" },
			middle: { band: "rounded-none" },
			end: { band: "rounded-r-full" },
			only: { band: "rounded-full" },
		},
		isToday: { true: {}, false: {} },
		isOutside: { true: {}, false: {} },
		isInvalid: { true: {}, false: {} },
		isDisabled: {
			true: { root: "opacity-50", dayBase: "opacity-40" },
			false: {},
		},
	},
	compoundVariants: [
		{ variant: "primary", tone: "selected", class: { dayBase: "bg-primary", dayLabel: "text-primary-foreground" } },
		{
			variant: "primary",
			tone: "selected",
			class: { pickerItem: "bg-primary", pickerItemLabel: "text-primary-foreground" },
		},
		{ variant: "primary", class: { band: "bg-accent" } },
		{ variant: "primary", tone: "band", class: { dayLabel: "text-accent-foreground" } },
		{
			variant: "secondary",
			tone: "selected",
			class: {
				dayBase: "bg-secondary",
				dayLabel: "text-secondary-foreground",
				pickerItem: "bg-secondary",
				pickerItemLabel: "text-secondary-foreground",
			},
		},
		{ variant: "secondary", class: { band: "bg-muted" } },
		{ variant: "secondary", tone: "band", class: { dayLabel: "text-foreground" } },
		{
			isInvalid: true,
			tone: "selected",
			class: {
				dayBase: "bg-destructive",
				dayLabel: "text-destructive-foreground",
				pickerItem: "bg-destructive",
				pickerItemLabel: "text-destructive-foreground",
			},
		},
		{ isInvalid: true, class: { band: "bg-destructive-soft" } },
		{ isInvalid: true, tone: "band", class: { dayLabel: "text-destructive-soft-foreground" } },
		{ isToday: true, tone: "plain", class: { dayBase: "border-ring", dayLabel: "font-semibold text-primary" } },
		{ isOutside: true, tone: "plain", class: { dayLabel: "text-muted-foreground" } },
	],
	defaultVariants: {
		variant: CALENDAR_DEFAULT_VARIANT,
		size: CALENDAR_DEFAULT_SIZE,
		tone: "plain",
		rangeRole: "none",
		isToday: false,
		isOutside: false,
		isInvalid: false,
		isDisabled: false,
	},
});

export type CalendarVariantProps = VariantProps<typeof calendarVariants>;

// ── Resolvers ───────────────────────────────────────────────────────────────

/**
 * Where `date` sits in `range`, or `null` outside it.
 *
 * A started range's one day is `only`, the same as a complete one-day range: both are a single
 * filled circle with nothing joining it to a neighbour.
 */
export function resolveRangeRole(range: CalendarDateRange, date: CalendarDate): CalendarRangeRole | null {
	const { start, end } = range;
	if (!start) return null;
	if (!end || isSameDay(start, end)) return isSameDay(start, date) ? "only" : null;
	if (isSameDay(start, date)) return "start";
	if (isSameDay(end, date)) return "end";
	return isBetween(date, start, end) ? "middle" : null;
}

/** How a day is painted, from whether it is selected and where it sits in a range. */
export function resolveDayTone({
	isSelected,
	rangeRole,
}: {
	isSelected: boolean;
	rangeRole: CalendarRangeRole | null;
}): CalendarDayTone {
	if (rangeRole === "middle") return "band";
	return isSelected || rangeRole !== null ? "selected" : "plain";
}

/** Whether a day is part of the selection, in whichever mode it is. */
export function isDateSelected(selection: CalendarSelectionState, date: CalendarDate): boolean {
	switch (selection.mode) {
		case "single":
			return isSameDay(selection.value, date);
		case "multiple":
			return selection.value.some((item) => isSameDay(item, date));
		case "range":
			return resolveRangeRole(selection.value, date) !== null;
	}
}

/** Everything a `Calendar.Day` needs to know to draw itself and decide whether it takes a tap. */
export type CalendarDayState = {
	isSelected: boolean;
	rangeRole: CalendarRangeRole | null;
	tone: CalendarDayTone;
	isToday: boolean;
	isOutside: boolean;
	/** Dimmed and announced as disabled: out of bounds, or matched. */
	isDisabled: boolean;
	/** Drawn as an empty cell — an outside day with `showOutsideDays` off. */
	isHidden: boolean;
	/** Takes a tap. */
	isPressable: boolean;
};

/**
 * One day's state, from its cell and the calendar around it.
 *
 * **An outside day shows no selection unless outside days are selectable.** It is a preview of
 * the next month, and a range drawn into it would read as a second copy of the range's end.
 * **`isReadOnly` stops the tap but not the paint**, while a disabled day or a disabled calendar
 * stops both — a read-only calendar is showing an answer, not offering a dead control.
 */
export function resolveDayState({
	cell,
	selection,
	today,
	isDisabled,
	showOutsideDays,
	selectOutsideDays,
	isCalendarDisabled,
	isReadOnly,
}: {
	cell: CalendarCell;
	selection: CalendarSelectionState;
	today: CalendarDate;
	isDisabled: (date: CalendarDate) => boolean;
	showOutsideDays: boolean;
	selectOutsideDays: boolean;
	isCalendarDisabled: boolean;
	isReadOnly: boolean;
}): CalendarDayState {
	const { date, isOutside } = cell;
	const isHidden = isOutside && !showOutsideDays;
	const showsSelection = !isOutside || selectOutsideDays;
	const isSelected = showsSelection && isDateSelected(selection, date);
	const rangeRole = showsSelection && selection.mode === "range" ? resolveRangeRole(selection.value, date) : null;
	const dayDisabled = isDisabled(date);

	return {
		isSelected,
		rangeRole,
		tone: resolveDayTone({ isSelected, rangeRole }),
		isToday: isSameDay(date, today),
		isOutside,
		isDisabled: dayDisabled,
		isHidden,
		isPressable: !isHidden && !dayDisabled && !isCalendarDisabled && !isReadOnly && (!isOutside || selectOutsideDays),
	};
}

/**
 * The first and last months the arrows and the swipe can reach.
 *
 * `startMonth`/`endMonth` when the caller names them, otherwise the months `minDate`/`maxDate`
 * fall in — paging to a month in which nothing can be picked is a dead end. Either may be `null`,
 * which is unbounded.
 */
export function resolveMonthBounds({
	startMonth,
	endMonth,
	minDate,
	maxDate,
}: {
	startMonth?: CalendarDate | null;
	endMonth?: CalendarDate | null;
	minDate?: CalendarDate | null;
	maxDate?: CalendarDate | null;
}): { first: CalendarDate | null; last: CalendarDate | null } {
	const first = startMonth ?? minDate;
	const last = endMonth ?? maxDate;
	return { first: first ? startOfMonth(first) : null, last: last ? startOfMonth(last) : null };
}

/** Whether `month` lies inside the bounds {@link resolveMonthBounds} returns, by month alone. */
export function isMonthInBounds(
	month: CalendarDate,
	{ first, last }: { first: CalendarDate | null; last: CalendarDate | null }
): boolean {
	const start = startOfMonth(month);
	if (first && compareDates(start, first) < 0) return false;
	if (last && compareDates(start, last) > 0) return false;
	return true;
}

/**
 * Which way a released swipe pages: `1` forward, `-1` back, `0` settle where it was.
 *
 * A swipe pages when it travelled past {@link CALENDAR_PAGE_THRESHOLD} of the width, or was
 * released faster than {@link CALENDAR_PAGE_VELOCITY} — unless the flick goes against the drag,
 * which is someone changing their mind. It never pages past a bound, and an unmeasured grid
 * never pages at all.
 */
export function resolvePageDirection({
	translationX,
	velocityX,
	width,
	canGoPrev,
	canGoNext,
}: {
	translationX: number;
	velocityX: number;
	width: number;
	canGoPrev: boolean;
	canGoNext: boolean;
}): -1 | 0 | 1 {
	"worklet";
	if (width <= 0 || translationX === 0) return 0;
	const direction = translationX < 0 ? 1 : -1;
	const against =
		(direction === 1 && velocityX > CALENDAR_PAGE_VELOCITY) ||
		(direction === -1 && velocityX < -CALENDAR_PAGE_VELOCITY);
	if (against) return 0;
	const far = Math.abs(translationX) >= width * CALENDAR_PAGE_THRESHOLD;
	const fast = Math.abs(velocityX) >= CALENDAR_PAGE_VELOCITY;
	if (!far && !fast) return 0;
	if (direction === 1 && !canGoNext) return 0;
	if (direction === -1 && !canGoPrev) return 0;
	return direction;
}

/** What a calendar was given at its own call site. */
export type CalendarOwnAxes = {
	variant?: CalendarVariant;
	size?: CalendarSize;
	isDisabled?: boolean;
	isInvalid?: boolean;
	isReadOnly?: boolean;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type CalendarFieldAxes = { isDisabled?: boolean; isInvalid?: boolean };

export type CalendarAxes = Required<CalendarOwnAxes>;

/**
 * Settles a calendar's axes: its own props, then an enclosing `Field`, then the defaults — `??`
 * throughout, so an explicit `false` is a value. A field reaches the two state axes only;
 * `isReadOnly` is the calendar's own.
 */
export function resolveCalendarAxes({
	own,
	field,
}: {
	own?: CalendarOwnAxes;
	field?: CalendarFieldAxes | null;
}): CalendarAxes {
	return {
		variant: own?.variant ?? CALENDAR_DEFAULT_VARIANT,
		size: own?.size ?? CALENDAR_DEFAULT_SIZE,
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
		isReadOnly: own?.isReadOnly ?? false,
	};
}
