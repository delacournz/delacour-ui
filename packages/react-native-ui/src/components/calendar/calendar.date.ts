/**
 * Calendar dates without time zones, and everything a month grid needs to do with them.
 *
 * A {@link CalendarDate} is three numbers — a year, a month and a day — and nothing else. There is
 * no instant behind it, so there is no time zone to shift it: the 5th is the 5th wherever the
 * phone is. Every comparison here works on the three fields, and the only place a `Date` appears
 * is at the two edges — {@link toDate}/{@link fromDate}, which read and write **local** fields,
 * and the formatters, which hand `Intl` a UTC instant and ask it to format in UTC so the day it
 * prints is the day it was given.
 *
 * This is a **leaf**: no React, no React Native, nothing but the language. `date-picker` and
 * `date-time-picker` import it as `../calendar/calendar.date`, never `../calendar`, so a picker
 * can do date maths without pulling the calendar's components in (AGENTS.md rule 3).
 */

/** A day on the Gregorian calendar. `month` is 1–12 and `day` 1–31, as a person writes them. */
export type CalendarDate = { year: number; month: number; day: number };

/** A day of the week, `0` for Sunday through `6` for Saturday — the numbering `Date#getDay` uses. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A range that is empty, started, or complete. An end is never set without a start. */
export type CalendarDateRange = { start: CalendarDate | null; end: CalendarDate | null };

/** One rule that disables days. A list of them disables any day one matches. */
export type DateMatcher =
	/** Exactly this day. */
	| { type: "date"; date: CalendarDate }
	/** Every day from `from` to `to`, both inclusive. A `null` end is open. */
	| { type: "span"; from: CalendarDate | null; to: CalendarDate | null }
	/** Every day falling on one of these weekdays. */
	| { type: "weekday"; days: readonly Weekday[] }
	/** Every day the test accepts. */
	| { type: "predicate"; test: (date: CalendarDate) => boolean };

/** One square of a month grid. */
export type CalendarCell = {
	date: CalendarDate;
	/** The day belongs to the month before or after the one the grid shows. */
	isOutside: boolean;
	/** The row, 0–5. */
	weekIndex: number;
	/** The column, 0–6, counted from the week's first day rather than from Sunday. */
	dayIndex: number;
};

/** How long a formatted date is: `5/10/2026`, `5 Oct 2026`, `5 October 2026` or `Monday 5 October 2026`. */
export type CalendarDateStyle = "short" | "medium" | "long" | "full";

export type CalendarDateFormatOptions = {
	/** A BCP 47 tag. Omitted, the device's own. An unreadable one falls back to `en`. */
	locale?: string;
	style: CalendarDateStyle;
};

/** What a selection holds, by mode — the value a `Calendar` keeps and reports. */
export type CalendarSelectionState =
	| { mode: "single"; value: CalendarDate | null }
	| { mode: "multiple"; value: readonly CalendarDate[] }
	| { mode: "range"; value: CalendarDateRange };

/** How many rows every month grid has, so paging never changes its height. */
export const CALENDAR_WEEKS = 6;

/** The weekday a week starts on when nothing better is known: Monday, the ISO 8601 week. */
export const DEFAULT_WEEK_START: Weekday = 1;

/** How far the year view reaches either side of the visible year when nothing bounds it. */
export const CALENDAR_YEAR_REACH = 100;

// ── Validity and comparison ─────────────────────────────────────────────────

/** Whether a year has a 29 February — every fourth, except centuries not divisible by 400. */
export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** How many days a month has. `month` is 1–12. */
export function daysInMonth(year: number, month: number): number {
	if (month === 2) return isLeapYear(year) ? 29 : 28;
	return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Whether three numbers name a day that exists — 29 February only in a leap year. */
export function isValidDate(date: CalendarDate): boolean {
	const { year, month, day } = date;
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
	if (month < 1 || month > 12) return false;
	return day >= 1 && day <= daysInMonth(year, month);
}

/** Negative when `a` is earlier, positive when later, zero on the same day. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
	return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** {@link compareDates} for the month alone — the day is ignored. */
export function compareMonths(a: CalendarDate, b: CalendarDate): number {
	return a.year - b.year || a.month - b.month;
}

/** Whether two dates are the same day. A `null` is never the same as anything. */
export function isSameDay(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined): boolean {
	if (!a || !b) return false;
	return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Whether two dates fall in the same month of the same year. */
export function isSameMonth(a: CalendarDate, b: CalendarDate): boolean {
	return a.year === b.year && a.month === b.month;
}

/** Whether `date` lies between `a` and `b`, both inclusive, whichever of them is earlier. */
export function isBetween(date: CalendarDate, a: CalendarDate, b: CalendarDate): boolean {
	const [low, high] = compareDates(a, b) <= 0 ? [a, b] : [b, a];
	return compareDates(date, low) >= 0 && compareDates(date, high) <= 0;
}

// ── Arithmetic ──────────────────────────────────────────────────────────────

/** Month offsets for Sakamoto's weekday method. */
const SAKAMOTO = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4] as const;

/**
 * The day of the week, `0` for Sunday — Sakamoto's method, so no `Date` and no time zone.
 *
 * January and February count as the end of the previous year, which is what puts the leap day at
 * the end of the cycle where it cannot disturb the months after it.
 */
export function weekdayOf(date: CalendarDate): Weekday {
	const year = date.month < 3 ? date.year - 1 : date.year;
	const offset = SAKAMOTO[date.month - 1] ?? 0;
	const raw = year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + offset + date.day;
	return (((raw % 7) + 7) % 7) as Weekday;
}

/**
 * Days since 1970-01-01 — the proleptic Gregorian day number.
 *
 * The civil-from-days pair is what lets {@link addDays} cross any number of month, year and leap
 * boundaries in constant time rather than walking them one at a time.
 */
function toDayNumber({ year, month, day }: CalendarDate): number {
	const y = month <= 2 ? year - 1 : year;
	const era = Math.floor(y / 400);
	const yearOfEra = y - era * 400;
	const monthFromMarch = month > 2 ? month - 3 : month + 9;
	const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + day - 1;
	const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
	return era * 146097 + dayOfEra - 719468;
}

/** The inverse of {@link toDayNumber}. */
function fromDayNumber(dayNumber: number): CalendarDate {
	const shifted = dayNumber + 719468;
	const era = Math.floor(shifted / 146097);
	const dayOfEra = shifted - era * 146097;
	const yearOfEra = Math.floor(
		(dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) - Math.floor(dayOfEra / 146096)) / 365
	);
	const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
	const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153);
	const day = dayOfYear - Math.floor((153 * monthFromMarch + 2) / 5) + 1;
	const month = monthFromMarch < 10 ? monthFromMarch + 3 : monthFromMarch - 9;
	const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
	return { year, month, day };
}

/** The day `n` days after `date`. A negative `n` goes back. */
export function addDays(date: CalendarDate, n: number): CalendarDate {
	return fromDayNumber(toDayNumber(date) + n);
}

/**
 * The same day `n` months later, clamped to the month it lands in.
 *
 * 31 January plus one month is the last day of February, not 3 March: a person paging forward a
 * month expects to land in the next month, and an overflow would skip one.
 */
export function addMonths(date: CalendarDate, n: number): CalendarDate {
	const index = date.year * 12 + (date.month - 1) + n;
	const year = Math.floor(index / 12);
	const month = index - year * 12 + 1;
	return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** The same day `n` years later. 29 February lands on the 28th in a common year. */
export function addYears(date: CalendarDate, n: number): CalendarDate {
	return addMonths(date, n * 12);
}

/** The first of the month `date` falls in. */
export function startOfMonth(date: CalendarDate): CalendarDate {
	return { year: date.year, month: date.month, day: 1 };
}

/** `date` held inside `min` and `max`, either of which may be absent. */
export function clampDate(
	date: CalendarDate,
	min: CalendarDate | null | undefined,
	max: CalendarDate | null | undefined
): CalendarDate {
	if (min && compareDates(date, min) < 0) return min;
	if (max && compareDates(date, max) > 0) return max;
	return date;
}

// ── The grid ────────────────────────────────────────────────────────────────

/**
 * The six weeks a month is drawn as, starting on `weekStartsOn`.
 *
 * **Always six rows.** The first row starts on the week containing the 1st, so a month beginning
 * on the first column has no leading week — its last two rows are both next month's. A fixed
 * count is what keeps the calendar's height, and every column's position, still while paging:
 * a February that fits in four rows would otherwise shrink the surface under the finger.
 */
export function monthGrid(month: CalendarDate, weekStartsOn: Weekday): CalendarCell[][] {
	const first = startOfMonth(month);
	const lead = (weekdayOf(first) - weekStartsOn + 7) % 7;
	const origin = toDayNumber(first) - lead;
	const weeks: CalendarCell[][] = [];

	for (let weekIndex = 0; weekIndex < CALENDAR_WEEKS; weekIndex += 1) {
		const week: CalendarCell[] = [];
		for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
			const date = fromDayNumber(origin + weekIndex * 7 + dayIndex);
			week.push({ date, isOutside: !isSameMonth(date, first), weekIndex, dayIndex });
		}
		weeks.push(week);
	}

	return weeks;
}

/**
 * The years the year view lists: the bounding months' years, or a century either side.
 *
 * A century rather than a decade because the commonest unbounded use is a birth date, and a
 * person born sixty years ago should not have to page to find their year.
 */
export function resolveYearSpan({
	visible,
	startMonth,
	endMonth,
}: {
	visible: CalendarDate;
	startMonth?: CalendarDate | null;
	endMonth?: CalendarDate | null;
}): { from: number; to: number } {
	return {
		from: startMonth?.year ?? visible.year - CALENDAR_YEAR_REACH,
		to: endMonth?.year ?? visible.year + CALENDAR_YEAR_REACH,
	};
}

// ── Native Date, at the edges ───────────────────────────────────────────────

/** A `Date` at local midnight on `date` — local fields, so the day is the one the phone shows. */
export function toDate(date: CalendarDate): Date {
	const native = new Date(2000, 0, 1);
	native.setFullYear(date.year, date.month - 1, date.day);
	return native;
}

/** The local day a `Date` falls on. The time is dropped, never rounded. */
export function fromDate(date: Date): CalendarDate {
	return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/** Today, on the phone's own calendar. */
export function today(): CalendarDate {
	return fromDate(new Date());
}

// ── Disabled days ───────────────────────────────────────────────────────────

/** Whether any of `matchers` disables `date`. */
export function matchesDisabled(date: CalendarDate, matchers: readonly DateMatcher[] | undefined): boolean {
	if (!matchers) return false;
	for (const matcher of matchers) {
		switch (matcher.type) {
			case "date":
				if (isSameDay(date, matcher.date)) return true;
				break;
			case "span":
				if (
					(!matcher.from || compareDates(date, matcher.from) >= 0) &&
					(!matcher.to || compareDates(date, matcher.to) <= 0)
				)
					return true;
				break;
			case "weekday":
				if (matcher.days.includes(weekdayOf(date))) return true;
				break;
			case "predicate":
				if (matcher.test(date)) return true;
				break;
		}
	}
	return false;
}

export type CalendarDateBounds = {
	minDate?: CalendarDate | null;
	maxDate?: CalendarDate | null;
	disabled?: readonly DateMatcher[];
};

/** Whether a day cannot be picked: before `minDate`, after `maxDate`, or matched. Both bounds inclusive. */
export function isDateDisabled(date: CalendarDate, { minDate, maxDate, disabled }: CalendarDateBounds): boolean {
	if (minDate && compareDates(date, minDate) < 0) return true;
	if (maxDate && compareDates(date, maxDate) > 0) return true;
	return matchesDisabled(date, disabled);
}

// ── Selection ───────────────────────────────────────────────────────────────

/** A range from two days in either order. */
export function normaliseRange(a: CalendarDate, b: CalendarDate): CalendarDateRange {
	return compareDates(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/**
 * The range after a tap on `date`.
 *
 * Empty or complete, a tap starts a new range there. Started, a second tap completes it in
 * either direction — the earlier of the two days is always the start — and the same day twice is
 * a one-day range. Booking a stay backwards, check-out first, is as natural as forwards.
 */
export function applyRangeTap(range: CalendarDateRange, date: CalendarDate): CalendarDateRange {
	if (!range.start || range.end) return { start: date, end: null };
	return normaliseRange(range.start, date);
}

/** Whether any day from `a` to `b`, both inclusive, is disabled. */
export function rangeContainsDisabled(
	a: CalendarDate,
	b: CalendarDate,
	isDisabled: (date: CalendarDate) => boolean
): boolean {
	const { start, end } = normaliseRange(a, b);
	if (!start || !end) return false;
	const last = toDayNumber(end);
	for (let day = toDayNumber(start); day <= last; day += 1) {
		if (isDisabled(fromDayNumber(day))) return true;
	}
	return false;
}

/** The single selection after a tap: the tapped day, or nothing when it was already selected. */
export function applySingleTap(selected: CalendarDate | null, date: CalendarDate): CalendarDate | null {
	return isSameDay(selected, date) ? null : date;
}

/** The list with `date` added, or removed when already present — sorted, without duplicates. */
export function toggleMultiple(list: readonly CalendarDate[], date: CalendarDate): CalendarDate[] {
	const present = list.some((item) => isSameDay(item, date));
	const next = present ? list.filter((item) => !isSameDay(item, date)) : [...list, date];
	const sorted = [...next].sort(compareDates);
	return sorted.filter((item, index) => index === 0 || !isSameDay(item, sorted[index - 1]));
}

/**
 * The selection after a tap on `date`, in whichever mode it is.
 *
 * A range that would complete across a disabled day restarts at the tap instead, so a booking can
 * never span a day that cannot be booked.
 */
export function nextSelection(
	state: CalendarSelectionState,
	date: CalendarDate,
	isDisabled: (date: CalendarDate) => boolean
): CalendarSelectionState {
	switch (state.mode) {
		case "single":
			return { mode: "single", value: applySingleTap(state.value, date) };
		case "multiple":
			return { mode: "multiple", value: toggleMultiple(state.value, date) };
		case "range": {
			const next = applyRangeTap(state.value, date);
			if (next.start && next.end && rangeContainsDisabled(next.start, next.end, isDisabled)) {
				return { mode: "range", value: { start: date, end: null } };
			}
			return { mode: "range", value: next };
		}
	}
}

// ── Locale ──────────────────────────────────────────────────────────────────

/** Regions whose week starts on Sunday, from CLDR's week data. */
const SUNDAY_REGIONS = new Set(
	"AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(
		" "
	)
);

/** Regions whose week starts on Saturday, from CLDR's week data. */
const SATURDAY_REGIONS = new Set("AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "));

/** Regions whose week starts on Friday, from CLDR's week data. */
const FRIDAY_REGIONS = new Set(["MV"]);

/** The region a bare language most likely means, for a tag with no region and no `Intl.Locale`. */
const LIKELY_REGION: Record<string, string> = {
	ar: "EG",
	en: "US",
	fa: "IR",
	he: "IL",
	hi: "IN",
	ja: "JP",
	ko: "KR",
	pt: "BR",
};

/** The first day of the week in a region, from the table — Monday when the region is unknown. */
export function weekStartFromRegion(region: string | undefined): Weekday {
	if (!region) return DEFAULT_WEEK_START;
	const upper = region.toUpperCase();
	if (SUNDAY_REGIONS.has(upper)) return 0;
	if (SATURDAY_REGIONS.has(upper)) return 6;
	if (FRIDAY_REGIONS.has(upper)) return 5;
	return DEFAULT_WEEK_START;
}

/** `Intl.Locale` as far as the week goes — the method is newer than the lib types. */
type LocaleWithWeekInfo = Intl.Locale & {
	getWeekInfo?: () => { firstDay: number };
	weekInfo?: { firstDay: number };
};

/**
 * The first day of the week in a locale.
 *
 * `Intl.Locale#getWeekInfo` (or the older `weekInfo` getter) answers when the engine has it; the
 * CLDR table answers when it does not, keyed on the tag's region or the region its language most
 * likely means. Hermes lacks the method on some builds, which is why the table ships regardless.
 * A tag nothing can read is Monday.
 */
export function resolveWeekStart(locale: string | undefined): Weekday {
	try {
		const tag = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as LocaleWithWeekInfo;
		const info = typeof tag.getWeekInfo === "function" ? tag.getWeekInfo() : tag.weekInfo;
		if (info && Number.isInteger(info.firstDay)) return (info.firstDay % 7) as Weekday;
		const region = tag.region ?? (typeof tag.maximize === "function" ? tag.maximize().region : undefined);
		return weekStartFromRegion(region ?? LIKELY_REGION[tag.language]);
	} catch {
		const match = locale?.match(/^([a-z]{2,3})(?:[-_][A-Za-z]{4})?(?:[-_]([A-Za-z]{2}))?(?:[-_]|$)/);
		if (!match) return DEFAULT_WEEK_START;
		return weekStartFromRegion(match[2] ?? LIKELY_REGION[match[1] ?? ""]);
	}
}

// ── Formatting ──────────────────────────────────────────────────────────────

/** The fallback locale for a tag `Intl` cannot read. */
const FALLBACK_LOCALE = "en";

const FORMAT_OPTIONS: Record<CalendarDateStyle, Intl.DateTimeFormatOptions> = {
	short: { day: "numeric", month: "numeric", year: "numeric" },
	medium: { day: "numeric", month: "short", year: "numeric" },
	long: { day: "numeric", month: "long", year: "numeric" },
	full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
};

/**
 * Built formatters, keyed on locale and options.
 *
 * A month grid formats forty-two accessibility labels a render, and constructing an
 * `Intl.DateTimeFormat` is the expensive half of formatting — so each one is built once.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * A formatter that prints a {@link CalendarDate} as the day it is, in any time zone.
 *
 * The date is handed over as a UTC instant and formatted in UTC, so no offset can move it across
 * midnight. A locale `Intl` rejects falls back to `en` rather than throwing.
 */
function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = `${locale ?? ""}|${JSON.stringify(options)}`;
	const cached = formatterCache.get(key);
	if (cached) return cached;

	let built: Intl.DateTimeFormat;
	try {
		built = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
	} catch {
		built = new Intl.DateTimeFormat(FALLBACK_LOCALE, { ...options, timeZone: "UTC" });
	}
	formatterCache.set(key, built);
	return built;
}

/** A UTC instant at midnight on `date`, for a UTC formatter. Years below 100 are not shifted to 19xx. */
function toUtcInstant(date: CalendarDate): Date {
	const native = new Date(0);
	native.setUTCFullYear(date.year, date.month - 1, date.day);
	return native;
}

/** A date as a person reads it, in the style and locale asked for. */
export function formatDate(date: CalendarDate, { locale, style }: CalendarDateFormatOptions): string {
	return formatter(locale, FORMAT_OPTIONS[style]).format(toUtcInstant(date));
}

/** The month and year a grid shows: "October 2026". */
export function formatMonthYear(date: CalendarDate, locale?: string): string {
	return formatter(locale, { month: "long", year: "numeric" }).format(toUtcInstant(date));
}

/** A year as the locale writes it. */
export function formatYear(year: number, locale?: string): string {
	return formatter(locale, { year: "numeric" }).format(toUtcInstant({ year, month: 1, day: 1 }));
}

/** `Intl.DateTimeFormat` as far as ranges go — `formatRange` is missing from some engines. */
type RangeFormatter = Intl.DateTimeFormat & { formatRange?: (start: Date, end: Date) => string };

/**
 * A range as a person reads it: empty, "5 Oct 2026 –", or the locale's own range form.
 *
 * `formatRange` collapses the parts two ends share ("5–9 Oct 2026") where the engine has it; an
 * en dash between two full dates stands in where it does not.
 */
export function formatDateRange(range: CalendarDateRange, options: CalendarDateFormatOptions): string {
	if (!range.start) return "";
	const start = formatDate(range.start, options);
	if (!range.end) return `${start} –`;
	if (isSameDay(range.start, range.end)) return start;

	const built = formatter(options.locale, FORMAT_OPTIONS[options.style]) as RangeFormatter;
	if (typeof built.formatRange === "function") {
		try {
			return built.formatRange(toUtcInstant(range.start), toUtcInstant(range.end));
		} catch {
			// Fall through to the plain form below.
		}
	}
	return `${start} – ${formatDate(range.end, options)}`;
}

/** A known Sunday — 1 January 2023 — that the weekday labels are counted from. */
const REFERENCE_SUNDAY: CalendarDate = { year: 2023, month: 1, day: 1 };

/** The seven weekday names in grid order, starting on `weekStartsOn`. */
export function weekdayLabels(
	locale: string | undefined,
	weekStartsOn: Weekday,
	width: "narrow" | "short" | "long"
): string[] {
	const built = formatter(locale, { weekday: width });
	return Array.from({ length: 7 }, (_, index) =>
		built.format(toUtcInstant(addDays(REFERENCE_SUNDAY, (weekStartsOn + index) % 7)))
	);
}

/** The twelve month names, January first. */
export function monthNames(locale?: string, width: "narrow" | "short" | "long" = "long"): string[] {
	const built = formatter(locale, { month: width });
	return Array.from({ length: 12 }, (_, index) => built.format(toUtcInstant({ year: 2001, month: index + 1, day: 1 })));
}

// ── ISO 8601 ────────────────────────────────────────────────────────────────

/** `YYYY-MM-DD`, zero-padded — the form a form library or an API stores. */
export function serialiseDate(date: CalendarDate): string {
	const pad = (value: number, length: number) => String(value).padStart(length, "0");
	return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

/**
 * A date from `YYYY-MM-DD`, or `null`.
 *
 * Strict: exactly that shape, and a day that exists. A timestamp is refused rather than truncated,
 * because which day an instant falls on depends on a time zone this type deliberately has none of.
 */
export function parseDate(value: string): CalendarDate | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
	return isValidDate(date) ? date : null;
}
