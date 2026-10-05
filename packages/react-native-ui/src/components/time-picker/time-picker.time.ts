/**
 * A time of day, and everything a picker needs to reason about one.
 *
 * Pure: no React, no React Native, so `bun test` reaches every function here and
 * a picker in another folder (`date-time-picker`) can import this module as a
 * leaf without pulling the `TimePicker` component in with it.
 *
 * **A stored time is always 24-hour.** `hour` is 0–23 whatever the clock face
 * shows; a 12-hour display is computed from it and back through
 * {@link to12Hour} and {@link to24Hour}, so switching `hourCycle` never changes
 * a value, only how it reads.
 */

/** A time of day with no date and no time zone. */
export type TimeValue = {
	/** 0–23. */
	hour: number;
	/** 0–59. */
	minute: number;
	/** 0–59, present only when the picker shows seconds. */
	second?: number;
};

/** How hours are displayed: 1–12 with a day period, or 0–23. */
export type HourCycle = 12 | 24;

/** Before or after noon, on a 12-hour clock. */
export type DayPeriod = "am" | "pm";

/** The inclusive range a picker accepts. Either end may be open. */
export type TimeBounds = { minTime?: TimeValue; maxTime?: TimeValue };

/** The minute steps a picker offers — every divisor of 60 a person would reach for. */
export const TIME_MINUTE_STEPS = [1, 2, 5, 10, 15, 20, 30] as const;

export type TimeMinuteStep = (typeof TIME_MINUTE_STEPS)[number];

const MINUTES_PER_DAY = 1440;

/** Whether every field is an integer in its range. */
export function isValidTime(time: TimeValue): boolean {
	const inRange = (value: number, max: number) => Number.isInteger(value) && value >= 0 && value <= max;
	return inRange(time.hour, 23) && inRange(time.minute, 59) && (time.second === undefined || inRange(time.second, 59));
}

/** Seconds since midnight; a missing `second` counts as zero. */
function toSeconds(time: TimeValue): number {
	return time.hour * 3600 + time.minute * 60 + (time.second ?? 0);
}

/** Negative when `a` is earlier, positive when later, zero when equal. */
export function compareTimes(a: TimeValue, b: TimeValue): number {
	return toSeconds(a) - toSeconds(b);
}

/** Minutes since midnight. Seconds are dropped. */
export function toMinutes(time: TimeValue): number {
	return time.hour * 60 + time.minute;
}

/** The time `minutes` after midnight, wrapped into one day. */
export function fromMinutes(minutes: number): TimeValue {
	const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
	return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

/** A stored hour as a 12-hour clock reads it: 0 is 12 AM, 12 is 12 PM. */
export function to12Hour(hour: number): { hour12: number; period: DayPeriod } {
	const period: DayPeriod = hour < 12 ? "am" : "pm";
	const hour12 = hour % 12 === 0 ? 12 : hour % 12;
	return { hour12, period };
}

/** A 12-hour clock reading as a stored hour: 12 AM is 0, 12 PM is 12. */
export function to24Hour(hour12: number, period: DayPeriod): number {
	const base = hour12 % 12;
	return period === "pm" ? base + 12 : base;
}

/** The number a clock in `cycle` shows for a stored hour. */
export function displayHour(hour: number, cycle: HourCycle): number {
	return cycle === 24 ? hour : to12Hour(hour).hour12;
}

/** The stored hour for a displayed one. `period` is ignored on a 24-hour clock. */
export function hourFromDisplay(display: number, cycle: HourCycle, period: DayPeriod): number {
	return cycle === 24 ? display : to24Hour(display, period);
}

/**
 * The nearest multiple of `step`. May return 60 — {@link snapTime} carries that
 * into the hour, which a minute alone cannot.
 */
export function snapMinute(minute: number, step: number): number {
	return Math.round(minute / step) * step;
}

/**
 * Rounds a time's minute to the nearest step, carrying into the hour.
 *
 * Rounding up past 23:59 does not wrap to midnight — that would turn "late" into
 * "early" — so the last step of the day is returned instead.
 */
export function snapTime(time: TimeValue, step: number): TimeValue {
	const snapped = time.hour * 60 + snapMinute(time.minute, step);
	const lastStep = MINUTES_PER_DAY - step;
	const { hour, minute } = fromMinutes(Math.min(snapped, lastStep));
	return time.second === undefined ? { hour, minute } : { hour, minute, second: time.second };
}

/**
 * The bounds a picker actually applies. A minimum after the maximum is a caller
 * mistake that would leave nothing selectable, so it is read as no bounds at all
 * rather than as an empty picker.
 */
export function normaliseBounds({ minTime, maxTime }: TimeBounds): TimeBounds {
	if (minTime && maxTime && compareTimes(minTime, maxTime) > 0) return {};
	return { minTime, maxTime };
}

/** Pulls a time inside `[min, max]`. Either bound may be absent. */
export function clampTime(time: TimeValue, min?: TimeValue, max?: TimeValue): TimeValue {
	const bounds = normaliseBounds({ minTime: min, maxTime: max });
	if (bounds.minTime && compareTimes(time, bounds.minTime) < 0) return bounds.minTime;
	if (bounds.maxTime && compareTimes(time, bounds.maxTime) > 0) return bounds.maxTime;
	return time;
}

/** Whether a time falls outside the bounds. The bounds themselves are enabled. */
export function isTimeDisabled(time: TimeValue, bounds: TimeBounds): boolean {
	return clampTime(time, bounds.minTime, bounds.maxTime) !== time;
}

/**
 * The minutes of `hour` a picker with this step and these bounds can land on.
 *
 * Compared at minute resolution, so a minimum of 09:20:30 still enables minute
 * 20 — some of its seconds are in range, and the seconds wheel picks them.
 */
export function minutesForHour(hour: number, step: number, bounds: TimeBounds): number[] {
	const { minTime, maxTime } = normaliseBounds(bounds);
	const low = minTime ? toMinutes(minTime) : 0;
	const high = maxTime ? toMinutes(maxTime) : MINUTES_PER_DAY - 1;
	const minutes: number[] = [];
	for (let minute = 0; minute < 60; minute += step) {
		const at = hour * 60 + minute;
		if (at >= low && at <= high) minutes.push(minute);
	}
	return minutes;
}

/** The hours holding at least one selectable minute. */
export function hoursInBounds(bounds: TimeBounds, step = 1): number[] {
	const hours: number[] = [];
	for (let hour = 0; hour < 24; hour++) {
		if (minutesForHour(hour, step, bounds).length > 0) hours.push(hour);
	}
	return hours;
}

/**
 * The selectable time closest to `time` — on the step and inside the bounds.
 *
 * What a wheel settles to when it lands on a dimmed row, and what an unset
 * picker opens on. Ties go to the earlier time. Bounds narrow enough to hold no
 * step at all fall back to plain clamping, so the picker still shows something
 * inside them.
 */
export function nearestEnabledTime(time: TimeValue, step: number, bounds: TimeBounds): TimeValue {
	const target = toMinutes(time);
	let best: number | null = null;
	for (let hour = 0; hour < 24; hour++) {
		for (const minute of minutesForHour(hour, step, bounds)) {
			const at = hour * 60 + minute;
			if (best === null || Math.abs(at - target) < Math.abs(best - target)) best = at;
		}
	}
	if (best === null) return clampTime(time, bounds.minTime, bounds.maxTime);
	const { hour, minute } = fromMinutes(best);
	const snapped: TimeValue = time.second === undefined ? { hour, minute } : { hour, minute, second: time.second };
	return clampTime(snapped, bounds.minTime, bounds.maxTime);
}

/**
 * Where an unset picker's wheels start: now, on the step, inside the bounds —
 * not midnight, which is the one time almost nobody is choosing.
 */
export function resolveInitialTime(now: TimeValue, step: number, bounds: TimeBounds, withSeconds = false): TimeValue {
	const base: TimeValue = withSeconds
		? { hour: now.hour, minute: now.minute, second: 0 }
		: { hour: now.hour, minute: now.minute };
	return nearestEnabledTime(base, step, bounds);
}

/** The current time on this device, without seconds unless asked. */
export function currentTime(date: Date = new Date()): TimeValue {
	return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() };
}

/**
 * The locale a picker formats with: the caller's when `Intl` accepts it, the
 * device's when none is given, and `en-US` when the tag is invalid.
 */
export function resolveLocale(locale?: string): string {
	try {
		return new Intl.DateTimeFormat(locale).resolvedOptions().locale;
	} catch {
		return "en-US";
	}
}

/**
 * The hour cycle a locale's clocks use. Unknown or invalid locales fall back to 12,
 * and nothing here throws — an `Intl` that rejects a tag must not take a form down.
 */
export function resolveHourCycle(locale?: string): HourCycle {
	try {
		const options = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions();
		if (options.hourCycle === "h23" || options.hourCycle === "h24") return 24;
		if (options.hourCycle === "h11" || options.hourCycle === "h12") return 12;
		if (options.hour12 === false) return 24;
		return 12;
	} catch {
		return 12;
	}
}

const FALLBACK_DAY_PERIODS: Record<DayPeriod, string> = { am: "AM", pm: "PM" };

/** The words a locale's 12-hour clock uses for before and after noon. */
export function resolveDayPeriodLabels(locale?: string): Record<DayPeriod, string> {
	try {
		const format = new Intl.DateTimeFormat(locale, { hour: "numeric", hourCycle: "h12" });
		const periodOf = (hour: number) =>
			format.formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === "dayPeriod")?.value;
		const am = periodOf(9);
		const pm = periodOf(21);
		return am && pm && am !== pm ? { am, pm } : FALLBACK_DAY_PERIODS;
	} catch {
		return FALLBACK_DAY_PERIODS;
	}
}

const pad = (value: number) => String(value).padStart(2, "0");

/** A locale-free reading of the time, for when `Intl` refuses the locale. */
function formatPlain(time: TimeValue, hourCycle: HourCycle): string {
	const seconds = time.second === undefined ? "" : `:${pad(time.second)}`;
	if (hourCycle === 24) return `${pad(time.hour)}:${pad(time.minute)}${seconds}`;
	const { hour12, period } = to12Hour(time.hour);
	return `${hour12}:${pad(time.minute)}${seconds} ${FALLBACK_DAY_PERIODS[period]}`;
}

/**
 * A time as the locale writes it, on the given clock. Seconds appear when the
 * value carries them. An invalid locale gets a plain `HH:mm` reading rather than
 * an exception.
 */
export function formatTime(time: TimeValue, { locale, hourCycle }: { locale?: string; hourCycle: HourCycle }): string {
	try {
		return new Intl.DateTimeFormat(locale, {
			hour: hourCycle === 24 ? "2-digit" : "numeric",
			minute: "2-digit",
			second: time.second === undefined ? undefined : "2-digit",
			hourCycle: hourCycle === 24 ? "h23" : "h12",
		}).format(new Date(2000, 0, 1, time.hour, time.minute, time.second ?? 0));
	} catch {
		return formatPlain(time, hourCycle);
	}
}

const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Reads `HH:mm` or `HH:mm:ss`. Anything else, or anything out of range, is `null`. */
export function parseTime(text: string): TimeValue | null {
	const match = TIME_PATTERN.exec(text.trim());
	if (!match) return null;
	const [, hour, minute, second] = match;
	const time: TimeValue =
		second === undefined
			? { hour: Number(hour), minute: Number(minute) }
			: { hour: Number(hour), minute: Number(minute), second: Number(second) };
	return isValidTime(time) ? time : null;
}

/** Writes `HH:mm`, or `HH:mm:ss` when the value carries seconds. */
export function serialiseTime(time: TimeValue): string {
	const base = `${pad(time.hour)}:${pad(time.minute)}`;
	return time.second === undefined ? base : `${base}:${pad(time.second)}`;
}
