/**
 * The planner's month math — Gregorian, local-calendar, and free of React
 * Native so `bun test` reaches all of it.
 *
 * **A day is a `YYYY-MM-DD` key, never a timestamp.** Two `Date`s on one
 * calendar day differ by hours, and a day is 23 or 25 hours long on a
 * daylight-saving night, so arithmetic in milliseconds puts an entry on the
 * neighbouring day twice a year. Every step here goes through the `Date`
 * constructor's own year/month/day fields instead, which the runtime
 * normalises in local time, and every comparison is between keys.
 */

/** The weekday a week opens on — `0` is Sunday, as `Date.getDay()` counts. */
export const PLANNER_WEEK_STARTS = [0, 1, 2, 3, 4, 5, 6] as const;

export type PlannerWeekStart = (typeof PLANNER_WEEK_STARTS)[number];

/** Six weeks of seven: every month fits, and paging never changes the grid's height. */
export const PLANNER_GRID_DAYS = 42;

/** A day of the grid. `isInMonth` is false for the leading and trailing days of the neighbours. */
export type PlannerGridDay = { key: string; date: Date; isInMonth: boolean };

/** One row of the scroller. `month` is the 1st of the month holding most of its days. */
export type PlannerWeek = { key: string; month: Date; days: readonly PlannerGridDay[] };

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, length: number): string {
	return String(value).padStart(length, "0");
}

/**
 * The local calendar day a date falls on, as `YYYY-MM-DD`.
 *
 * A string is taken as written rather than parsed — `new Date("2026-04-05")`
 * is UTC midnight, which is the 4th anywhere west of Greenwich — and must be a
 * real day: a malformed or impossible one throws rather than landing on a guess.
 */
export function toDayKey(date: Date | string): string {
	if (typeof date === "string") {
		const match = DAY_KEY.exec(date);
		if (match) {
			const [, year, month, day] = match;
			const parsed = new Date(Number(year), Number(month) - 1, Number(day));
			if (parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day)) return date;
		}
		throw new Error(`Planner: "${date}" is not a YYYY-MM-DD day.`);
	}

	return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** Local midnight of a `YYYY-MM-DD` day. */
export function fromDayKey(key: string): Date {
	const match = DAY_KEY.exec(key);
	if (!match) throw new Error(`Planner: "${key}" is not a YYYY-MM-DD day.`);
	const [, year, month, day] = match;
	return new Date(Number(year), Number(month) - 1, Number(day));
}

/** The 1st of the month, at local midnight. */
export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** The same calendar day `amount` days on, whatever length the days between are. */
export function addDays(date: Date, amount: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/**
 * The same day `amount` months on, clamped to the end of a shorter month —
 * 31 January plus one is 28 or 29 February, never 3 March.
 */
export function addMonths(date: Date, amount: number): Date {
	const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
	const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
	return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

/** Whether two dates fall in the same calendar month. */
export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** The first day of the week holding `date`. */
export function startOfWeek(date: Date, weekStartsOn: PlannerWeekStart): Date {
	return addDays(date, -((date.getDay() - weekStartsOn + 7) % 7));
}

/**
 * The month as 42 days — six weeks from the week holding the 1st.
 *
 * Always six, even for a February that fits in four: a grid whose height
 * follows the month would jump every time it paged.
 */
export function buildMonthGrid(month: Date, weekStartsOn: PlannerWeekStart): PlannerGridDay[] {
	const first = startOfMonth(month);
	const start = startOfWeek(first, weekStartsOn);

	return Array.from({ length: PLANNER_GRID_DAYS }, (_, index) => {
		const date = addDays(start, index);
		return { key: toDayKey(date), date, isInMonth: isSameMonth(date, first) };
	});
}

/**
 * Weeks for the scroller: `weeks` either side of the week holding the month's
 * 1st, and the index of that week.
 *
 * Each week is labelled by its fourth day — the month holding most of the
 * seven — which is what a header following the scroll should read. Every day
 * is in-month: a continuous list has no neighbours to grey out.
 */
export function buildWeekRange(
	month: Date,
	weeks: number,
	weekStartsOn: PlannerWeekStart
): { weeks: PlannerWeek[]; initialIndex: number } {
	const span = Math.max(0, Math.floor(weeks));
	const anchor = startOfWeek(startOfMonth(month), weekStartsOn);

	const rows = Array.from({ length: span * 2 + 1 }, (_, row) => {
		const start = addDays(anchor, (row - span) * 7);
		const days = Array.from({ length: 7 }, (_, index) => {
			const date = addDays(start, index);
			return { key: toDayKey(date), date, isInMonth: true };
		});
		return { key: toDayKey(start), month: startOfMonth(addDays(start, 3)), days };
	});

	return { weeks: rows, initialIndex: span };
}

type WeekInfo = { firstDay: number };
type LocaleWithWeekInfo = Intl.Locale & { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo };

/** Monday — ISO 8601's week, and most of the world's. */
const FALLBACK_WEEK_START: PlannerWeekStart = 1;

function isWeekStart(value: number): value is PlannerWeekStart {
	return Number.isInteger(value) && value >= 0 && value <= 6;
}

/**
 * The weekday a week opens on.
 *
 * `auto` asks the locale — `Intl.Locale`'s week info, as a method on newer
 * engines and a getter on older ones, counting Sunday as 7 — and falls back to
 * Monday when the runtime cannot say or the locale is not one.
 */
export function resolveWeekStart(
	locale: string | undefined,
	weekStartsOn: PlannerWeekStart | "auto"
): PlannerWeekStart {
	if (weekStartsOn !== "auto") return weekStartsOn;

	try {
		const resolved: LocaleWithWeekInfo = new Intl.Locale(locale ?? Intl.DateTimeFormat().resolvedOptions().locale);
		const info = resolved.getWeekInfo?.() ?? resolved.weekInfo;
		const day = info ? info.firstDay % 7 : Number.NaN;
		return isWeekStart(day) ? day : FALLBACK_WEEK_START;
	} catch {
		return FALLBACK_WEEK_START;
	}
}

export type PlannerWeekdayLabel = { narrow: string; short: string; long: string };

/** A Sunday, so index 0 below is Sunday and the offsets match `getDay()`. */
const REFERENCE_SUNDAY = new Date(2023, 0, 1);

/** The seven weekday names, in the order the grid draws its columns. */
export function weekdayLabels(locale: string | undefined, weekStartsOn: PlannerWeekStart): PlannerWeekdayLabel[] {
	const narrow = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
	const short = new Intl.DateTimeFormat(locale, { weekday: "short" });
	const long = new Intl.DateTimeFormat(locale, { weekday: "long" });

	return Array.from({ length: 7 }, (_, index) => {
		const date = addDays(REFERENCE_SUNDAY, (weekStartsOn + index) % 7);
		return { narrow: narrow.format(date), short: short.format(date), long: long.format(date) };
	});
}

/** "October 2026", in the locale's words. */
export function formatMonthTitle(month: Date, locale: string | undefined): string {
	return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
}

/** "Wednesday, 14 October", in the locale's words — a day's name for a heading or a label. */
export function formatDayTitle(date: Date, locale: string | undefined): string {
	return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(date);
}

/**
 * Milliseconds until the next local midnight, for the timer that moves "today".
 *
 * Measured against the next day's own midnight rather than `now + 24h`, so a
 * 23- or 25-hour day still fires at 00:00. Never zero: a timer armed at
 * midnight exactly waits the whole day rather than firing in a loop.
 */
export function msUntilNextMidnight(now: Date): number {
	const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	return Math.max(1, next.getTime() - now.getTime());
}
