/**
 * A date and a time of day, held together — and everything a picker needs to reason about one.
 *
 * Pure: no React, no React Native, so every function here is unit-testable. It composes the two
 * leaves it stands on rather than restating them: every day sum is `calendar.date`'s and every
 * minute sum is `time-picker.time`'s. What lives here is only what neither can answer alone —
 * the order of two date-times, and how a bound on one day becomes a bound on that day's clock.
 *
 * **A value is wall-clock time, with no zone.** `{ date: 5 Oct, time: 15:30 }` is half past three
 * on the 5th wherever the phone is. The only `Date` objects are at the edges —
 * {@link toNativeDate} and {@link fromNativeDate}, which read and write **local** fields — and in
 * the formatter, which hands `Intl` a UTC instant and asks for UTC so the day it prints is the day
 * it was given.
 */

import {
	addDays,
	type CalendarDate,
	clampDate,
	compareDates,
	type DateMatcher,
	formatDate,
	isDateDisabled,
	isSameDay,
	isValidDate,
	parseDate,
	serialiseDate,
} from "../calendar/calendar.date";
import {
	clampTime,
	compareTimes,
	formatTime,
	fromMinutes,
	type HourCycle,
	isTimeDisabled,
	isValidTime,
	nearestEnabledTime,
	parseTime,
	serialiseTime,
	type TimeBounds,
	type TimeValue,
} from "../time-picker/time-picker.time";

/** A day and a time of day on it, with no zone. */
export type DateTimeValue = { date: CalendarDate; time: TimeValue };

/** The inclusive window a picker accepts. Either end may be open. */
export type DateTimeBounds = { minDateTime?: DateTimeValue; maxDateTime?: DateTimeValue };

/** The window plus the further days that cannot be picked. */
export type DateTimeRules = DateTimeBounds & { disabled?: readonly DateMatcher[] };

/** How far {@link nearestAllowedDate} looks in each direction before giving up: a year and a day. */
export const DATE_TIME_SEARCH_DAYS = 366;

const MINUTES_PER_DAY = 1440;

/** Negative when `a` is earlier, positive when later, zero when equal. Date first, then time. */
export function compareDateTimes(a: DateTimeValue, b: DateTimeValue): number {
	return compareDates(a.date, b.date) || compareTimes(a.time, b.time);
}

/**
 * The window a picker actually applies. A minimum after the maximum is a caller mistake that
 * would leave nothing selectable, so it reads as no window at all — the rule `normaliseBounds`
 * applies to a bare time.
 */
export function normaliseDateTimeBounds({ minDateTime, maxDateTime }: DateTimeBounds): DateTimeBounds {
	if (minDateTime && maxDateTime && compareDateTimes(minDateTime, maxDateTime) > 0) return {};
	const bounds: DateTimeBounds = {};
	if (minDateTime) bounds.minDateTime = minDateTime;
	if (maxDateTime) bounds.maxDateTime = maxDateTime;
	return bounds;
}

/** The days a calendar is bounded by — the window's two dates. */
export function resolveCalendarBounds(rules: DateTimeBounds): {
	minDate: CalendarDate | undefined;
	maxDate: CalendarDate | undefined;
} {
	const { minDateTime, maxDateTime } = normaliseDateTimeBounds(rules);
	return { minDate: minDateTime?.date, maxDate: maxDateTime?.date };
}

/**
 * The time bounds a day carries: none strictly inside the window, the minimum's time on its own
 * day, the maximum's on its, both on a one-day window — and `null` for a day outside the window,
 * where no time at all can be picked.
 *
 * This is what makes a single date-time bound compose. "Not before 9:15 on the 5th" is a bound on
 * the 5th's clock and on nothing else; a separate `minTime` would wrongly forbid 8:00 on the 6th.
 */
export function timeBoundsForDate(
	date: CalendarDate,
	minDateTime?: DateTimeValue,
	maxDateTime?: DateTimeValue
): TimeBounds | null {
	const window = normaliseDateTimeBounds({ minDateTime, maxDateTime });
	if (window.minDateTime && compareDates(date, window.minDateTime.date) < 0) return null;
	if (window.maxDateTime && compareDates(date, window.maxDateTime.date) > 0) return null;
	const bounds: TimeBounds = {};
	if (window.minDateTime && isSameDay(date, window.minDateTime.date)) bounds.minTime = window.minDateTime.time;
	if (window.maxDateTime && isSameDay(date, window.maxDateTime.date)) bounds.maxTime = window.maxDateTime.time;
	return bounds;
}

/** Pulls a value inside the window. Either end may be open. */
export function clampDateTime(
	value: DateTimeValue,
	minDateTime?: DateTimeValue,
	maxDateTime?: DateTimeValue
): DateTimeValue {
	const window = normaliseDateTimeBounds({ minDateTime, maxDateTime });
	if (window.minDateTime && compareDateTimes(value, window.minDateTime) < 0) return window.minDateTime;
	if (window.maxDateTime && compareDateTimes(value, window.maxDateTime) > 0) return window.maxDateTime;
	return value;
}

/**
 * Rounds a time **up** onto the step, without wrapping past the day's last step.
 *
 * Up rather than to the nearest because a picker that starts at "now" is choosing something ahead
 * of now — at 10:07 on a quarter-hour step the next slot is 10:15, not the 10:00 already gone. At
 * 23:55 the next slot is tomorrow, which this value cannot say, so the day's last step stands.
 */
function ceilToStep(time: TimeValue, step: number): TimeValue {
	const minutes = time.hour * 60 + Math.ceil(time.minute / step) * step;
	return fromMinutes(Math.min(minutes, MINUTES_PER_DAY - step));
}

/** Adds or drops the seconds field so a value matches the wheel it is shown on. */
function withSeconds(time: TimeValue, showSeconds: boolean): TimeValue {
	return showSeconds
		? { hour: time.hour, minute: time.minute, second: time.second ?? 0 }
		: { hour: time.hour, minute: time.minute };
}

/**
 * The whole value from a picked day while no time is set: now, rounded up onto the step and held
 * inside that day's bounds. Never half a value.
 */
export function completeFromDate(
	date: CalendarDate,
	now: TimeValue,
	minuteStep: number,
	rules: DateTimeBounds,
	showSeconds = false
): DateTimeValue {
	const start = ceilToStep({ hour: now.hour, minute: now.minute }, minuteStep);
	const bounds = timeBoundsForDate(date, rules.minDateTime, rules.maxDateTime);
	if (!bounds) {
		const clamped = clampDateTime({ date, time: start }, rules.minDateTime, rules.maxDateTime);
		return { date: clamped.date, time: withSeconds(clamped.time, showSeconds) };
	}
	return { date, time: withSeconds(nearestEnabledTime(start, minuteStep, bounds), showSeconds) };
}

/**
 * The pickable day closest to `from`: `from` itself, else the next allowed one, else — past the
 * window's end — the last allowed one before it. `null` when nothing in a year either way can be
 * picked.
 */
export function nearestAllowedDate(from: CalendarDate, rules: DateTimeRules): CalendarDate | null {
	const { minDate, maxDate } = resolveCalendarBounds(rules);
	const start = clampDate(from, minDate, maxDate);
	const isAllowed = (date: CalendarDate) => !isDateDisabled(date, { disabled: rules.disabled, maxDate, minDate });

	for (let offset = 0; offset <= DATE_TIME_SEARCH_DAYS; offset += 1) {
		const candidate = addDays(start, offset);
		if (maxDate && compareDates(candidate, maxDate) > 0) break;
		if (isAllowed(candidate)) return candidate;
	}
	for (let offset = 1; offset <= DATE_TIME_SEARCH_DAYS; offset += 1) {
		const candidate = addDays(start, -offset);
		if (minDate && compareDates(candidate, minDate) < 0) break;
		if (isAllowed(candidate)) return candidate;
	}
	return null;
}

/**
 * The whole value from a picked time while no date is set: today, or the nearest day that can be
 * picked, with the time held inside that day's bounds. `null` when no day can be.
 */
export function completeFromTime(time: TimeValue, today: CalendarDate, rules: DateTimeRules): DateTimeValue | null {
	const date = nearestAllowedDate(today, rules);
	if (!date) return null;
	const bounds = timeBoundsForDate(date, rules.minDateTime, rules.maxDateTime) ?? {};
	return { date, time: clampTime(time, bounds.minTime, bounds.maxTime) };
}

/**
 * A day picked on the calendar, applied to the current value.
 *
 * From nothing it completes the value ({@link completeFromDate}). Otherwise the time stays — unless
 * the new day's bounds rule it out, when it moves to the nearest time on the step that they allow.
 */
export function applyDate(
	value: DateTimeValue | null,
	date: CalendarDate,
	{
		now,
		minuteStep,
		rules,
		showSeconds = false,
	}: { now: TimeValue; minuteStep: number; rules: DateTimeBounds; showSeconds?: boolean }
): DateTimeValue {
	if (!value) return completeFromDate(date, now, minuteStep, rules, showSeconds);
	const bounds = timeBoundsForDate(date, rules.minDateTime, rules.maxDateTime);
	if (!bounds) return clampDateTime({ date, time: value.time }, rules.minDateTime, rules.maxDateTime);
	if (!isTimeDisabled(value.time, bounds)) return { date, time: value.time };
	return { date, time: nearestEnabledTime(value.time, minuteStep, bounds) };
}

/**
 * A time settled on the wheel, applied to the current value.
 *
 * From nothing it completes the value ({@link completeFromTime}), and stays `null` only when no
 * day can be picked at all. Otherwise the date stays and the time is held inside its bounds.
 */
export function applyTime(
	value: DateTimeValue | null,
	time: TimeValue,
	{ today, rules }: { today: CalendarDate; rules: DateTimeRules }
): DateTimeValue | null {
	if (!value) return completeFromTime(time, today, rules);
	const bounds = timeBoundsForDate(value.date, rules.minDateTime, rules.maxDateTime);
	if (!bounds) return clampDateTime({ date: value.date, time }, rules.minDateTime, rules.maxDateTime);
	return { date: value.date, time: clampTime(time, bounds.minTime, bounds.maxTime) };
}

/** Whether both halves are real and, given rules, inside the window on a day that can be picked. */
export function isDateTimeValid(value: DateTimeValue, rules: DateTimeRules = {}): boolean {
	if (!isValidDate(value.date) || !isValidTime(value.time)) return false;
	if (isDateDisabled(value.date, { disabled: rules.disabled })) return false;
	return clampDateTime(value, rules.minDateTime, rules.maxDateTime) === value;
}

// ── Native Date, at the edges ───────────────────────────────────────────────

/**
 * A `Date` at this wall-clock time on this phone — local fields, so the day and hour are the ones
 * the phone shows. A time inside a daylight-saving gap is moved forward by the platform, as any
 * local `Date` is.
 */
export function toNativeDate(value: DateTimeValue): Date {
	const native = new Date(2000, 0, 1, 0, 0, 0, 0);
	native.setFullYear(value.date.year, value.date.month - 1, value.date.day);
	native.setHours(value.time.hour, value.time.minute, value.time.second ?? 0, 0);
	return native;
}

/** The local wall-clock time a `Date` falls on. Seconds and milliseconds are dropped, never rounded. */
export function fromNativeDate(date: Date): DateTimeValue {
	return {
		date: { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() },
		time: { hour: date.getHours(), minute: date.getMinutes() },
	};
}

// ── Formatting ──────────────────────────────────────────────────────────────

export type DateTimeFormatContext = { locale?: string; hourCycle: HourCycle };

/** A UTC instant at this wall-clock time, for a UTC formatter. Years below 100 are not shifted. */
function toUtcInstant({ date, time }: DateTimeValue): Date {
	const native = new Date(0);
	native.setUTCFullYear(date.year, date.month - 1, date.day);
	native.setUTCHours(time.hour, time.minute, time.second ?? 0, 0);
	return native;
}

/**
 * The trigger's text: "Mon, Oct 5, 3:30 PM" in en-US, "Mon 5 Oct, 15:30" in en-GB — the locale's
 * own join, on the hour cycle asked for. Seconds appear when the value carries them. An invalid
 * locale gets the two leaves' own readings joined by a comma rather than an exception.
 */
export function formatDateTime(value: DateTimeValue, { locale, hourCycle }: DateTimeFormatContext): string {
	try {
		return new Intl.DateTimeFormat(locale, {
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: hourCycle === 24 ? "2-digit" : "numeric",
			minute: "2-digit",
			second: value.time.second === undefined ? undefined : "2-digit",
			hourCycle: hourCycle === 24 ? "h23" : "h12",
			timeZone: "UTC",
		}).format(toUtcInstant(value));
	} catch {
		return `${formatDate(value.date, { locale, style: "medium" })}, ${formatTime(value.time, { locale, hourCycle })}`;
	}
}

/** What a screen reader hears: "Monday 5 October 2026 at 3:30 PM" — every word, no abbreviations. */
export function formatDateTimeLong(value: DateTimeValue, context: DateTimeFormatContext): string {
	return `${formatDate(value.date, { locale: context.locale, style: "full" })} at ${formatTime(value.time, context)}`;
}

// ── ISO 8601 ────────────────────────────────────────────────────────────────

/** `YYYY-MM-DDTHH:mm`, or with `:ss` when the value carries seconds. No zone — there is none. */
export function serialiseDateTime(value: DateTimeValue): string {
	return `${serialiseDate(value.date)}T${serialiseTime(value.time)}`;
}

/**
 * A value from `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`, or `null`.
 *
 * Strict, like both halves: a zone suffix is refused rather than dropped, because which wall-clock
 * time an instant names depends on a zone this type deliberately has none of.
 */
export function parseDateTime(text: string): DateTimeValue | null {
	const parts = text.split("T");
	if (parts.length !== 2) return null;
	const [datePart = "", timePart = ""] = parts;
	if (timePart.trim() !== timePart) return null;
	const date = parseDate(datePart);
	const time = parseTime(timePart);
	return date && time ? { date, time } : null;
}
