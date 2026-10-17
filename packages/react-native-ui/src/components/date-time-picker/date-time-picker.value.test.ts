import { describe, expect, test } from "bun:test";
import type { CalendarDate } from "../calendar/calendar.date";
import type { TimeValue } from "../time-picker/time-picker.time";
import {
	applyDate,
	applyTime,
	clampDateTime,
	compareDateTimes,
	completeFromDate,
	completeFromTime,
	type DateTimeValue,
	formatDateTime,
	formatDateTimeLong,
	fromNativeDate,
	isDateTimeValid,
	nearestAllowedDate,
	normaliseDateTimeBounds,
	parseDateTime,
	resolveCalendarBounds,
	serialiseDateTime,
	timeBoundsForDate,
	toNativeDate,
} from "./date-time-picker.value";

function d(year: number, month: number, day: number): CalendarDate {
	return { year, month, day };
}

function t(hour: number, minute: number, second?: number): TimeValue {
	return second === undefined ? { hour, minute } : { hour, minute, second };
}

function dt(date: CalendarDate, time: TimeValue): DateTimeValue {
	return { date, time };
}

const OCT_5 = d(2026, 10, 5);
const OCT_6 = d(2026, 10, 6);
const OCT_9 = d(2026, 10, 9);
const OCT_10 = d(2026, 10, 10);

describe("compareDateTimes", () => {
	test("orders by date first", () => {
		expect(compareDateTimes(dt(OCT_5, t(23, 0)), dt(OCT_6, t(1, 0)))).toBeLessThan(0);
		expect(compareDateTimes(dt(OCT_6, t(1, 0)), dt(OCT_5, t(23, 0)))).toBeGreaterThan(0);
	});

	test("then by time", () => {
		expect(compareDateTimes(dt(OCT_5, t(9, 0)), dt(OCT_5, t(9, 30)))).toBeLessThan(0);
		expect(compareDateTimes(dt(OCT_5, t(9, 30)), dt(OCT_5, t(9, 0)))).toBeGreaterThan(0);
	});

	test("equal values compare to zero", () => {
		expect(compareDateTimes(dt(OCT_5, t(9, 30)), dt(OCT_5, t(9, 30)))).toBe(0);
	});
});

describe("normaliseDateTimeBounds", () => {
	test("keeps ordered bounds", () => {
		const bounds = { minDateTime: dt(OCT_5, t(9, 0)), maxDateTime: dt(OCT_9, t(17, 0)) };
		expect(normaliseDateTimeBounds(bounds)).toEqual(bounds);
	});

	test("reads a minimum after the maximum as no bounds", () => {
		expect(normaliseDateTimeBounds({ minDateTime: dt(OCT_9, t(9, 0)), maxDateTime: dt(OCT_5, t(9, 0)) })).toEqual({});
	});
});

describe("timeBoundsForDate", () => {
	const min = dt(OCT_5, t(9, 15));
	const max = dt(OCT_9, t(17, 30));

	test("a date strictly between the bounds has open time bounds", () => {
		expect(timeBoundsForDate(d(2026, 10, 7), min, max)).toEqual({});
	});

	test("the min date bounds the time from below", () => {
		expect(timeBoundsForDate(OCT_5, min, max)).toEqual({ minTime: t(9, 15) });
	});

	test("the max date bounds the time from above", () => {
		expect(timeBoundsForDate(OCT_9, min, max)).toEqual({ maxTime: t(17, 30) });
	});

	test("a single-day window bounds both ends", () => {
		expect(timeBoundsForDate(OCT_5, min, dt(OCT_5, t(12, 0)))).toEqual({ minTime: t(9, 15), maxTime: t(12, 0) });
	});

	test("a date outside the window allows no time at all", () => {
		expect(timeBoundsForDate(d(2026, 10, 4), min, max)).toBeNull();
		expect(timeBoundsForDate(OCT_10, min, max)).toBeNull();
	});

	test("no bounds at all is open", () => {
		expect(timeBoundsForDate(OCT_5)).toEqual({});
	});
});

describe("clampDateTime", () => {
	const min = dt(OCT_5, t(9, 15));
	const max = dt(OCT_9, t(17, 30));

	test("below the minimum snaps to it", () => {
		expect(clampDateTime(dt(d(2026, 10, 1), t(12, 0)), min, max)).toEqual(min);
		expect(clampDateTime(dt(OCT_5, t(8, 0)), min, max)).toEqual(min);
	});

	test("above the maximum snaps to it", () => {
		expect(clampDateTime(dt(OCT_10, t(8, 0)), min, max)).toEqual(max);
		expect(clampDateTime(dt(OCT_9, t(18, 0)), min, max)).toEqual(max);
	});

	test("inside is returned untouched", () => {
		const inside = dt(OCT_6, t(3, 0));
		expect(clampDateTime(inside, min, max)).toBe(inside);
	});
});

describe("completeFromDate", () => {
	test("a date with no time takes now, rounded up onto the step", () => {
		expect(completeFromDate(OCT_5, t(10, 7), 15, {})).toEqual(dt(OCT_5, t(10, 15)));
	});

	test("a time already on the step stays", () => {
		expect(completeFromDate(OCT_5, t(10, 30), 15, {})).toEqual(dt(OCT_5, t(10, 30)));
	});

	test("late in the evening it clamps to the day's last step rather than wrapping", () => {
		expect(completeFromDate(OCT_5, t(23, 55), 15, {})).toEqual(dt(OCT_5, t(23, 45)));
	});

	test("on the min date the time is pulled up to the minimum", () => {
		expect(completeFromDate(OCT_5, t(8, 0), 15, { minDateTime: dt(OCT_5, t(9, 15)) })).toEqual(dt(OCT_5, t(9, 15)));
	});

	test("on the max date the time is pulled down to the maximum", () => {
		expect(completeFromDate(OCT_9, t(20, 0), 15, { maxDateTime: dt(OCT_9, t(17, 30)) })).toEqual(dt(OCT_9, t(17, 30)));
	});

	test("seconds are carried as zero when asked", () => {
		expect(completeFromDate(OCT_5, t(10, 7), 5, {}, true)).toEqual(dt(OCT_5, t(10, 10, 0)));
	});
});

describe("nearestAllowedDate", () => {
	const weekends = [{ type: "weekday", days: [0, 6] }] as const;

	test("an allowed day is itself", () => {
		expect(nearestAllowedDate(OCT_5, {})).toEqual(OCT_5);
	});

	test("skips disabled days forward", () => {
		expect(nearestAllowedDate(OCT_10, { disabled: weekends })).toEqual(d(2026, 10, 12));
	});

	test("a day before the window starts at its first day", () => {
		expect(nearestAllowedDate(d(2026, 10, 1), { minDateTime: dt(OCT_5, t(9, 0)) })).toEqual(OCT_5);
	});

	test("a day after the window falls back to its last day", () => {
		expect(nearestAllowedDate(d(2026, 11, 1), { maxDateTime: dt(OCT_9, t(9, 0)) })).toEqual(OCT_9);
	});

	test("nothing allowed within a year is null", () => {
		expect(nearestAllowedDate(OCT_5, { disabled: [{ type: "predicate", test: () => true }] })).toBeNull();
	});
});

describe("completeFromTime", () => {
	test("a time with no date lands on today", () => {
		expect(completeFromTime(t(15, 30), OCT_5, {})).toEqual(dt(OCT_5, t(15, 30)));
	});

	test("a disabled today moves to the next allowed day", () => {
		const weekends = [{ type: "weekday", days: [0, 6] }] as const;
		expect(completeFromTime(t(15, 30), OCT_10, { disabled: weekends })).toEqual(dt(d(2026, 10, 12), t(15, 30)));
	});

	test("no allowed day is null", () => {
		expect(completeFromTime(t(15, 30), OCT_5, { disabled: [{ type: "predicate", test: () => true }] })).toBeNull();
	});

	test("the time is clamped into the chosen day's bounds", () => {
		expect(completeFromTime(t(8, 0), OCT_5, { minDateTime: dt(OCT_5, t(9, 15)) })).toEqual(dt(OCT_5, t(9, 15)));
	});
});

describe("applyDate", () => {
	test("from nothing it completes the value", () => {
		expect(applyDate(null, OCT_5, { now: t(10, 7), minuteStep: 15, rules: {} })).toEqual(dt(OCT_5, t(10, 15)));
	});

	test("keeps the time when the new day allows it", () => {
		expect(applyDate(dt(OCT_6, t(8, 0)), OCT_9, { now: t(10, 7), minuteStep: 15, rules: {} })).toEqual(
			dt(OCT_9, t(8, 0))
		);
	});

	test("re-clamps an earlier time up when the date moves to the min date", () => {
		const rules = { minDateTime: dt(OCT_5, t(9, 15)) };
		expect(applyDate(dt(OCT_6, t(8, 0)), OCT_5, { now: t(10, 7), minuteStep: 15, rules })).toEqual(dt(OCT_5, t(9, 15)));
	});

	test("re-clamps a later time down when the date moves to the max date", () => {
		const rules = { maxDateTime: dt(OCT_9, t(17, 30)) };
		expect(applyDate(dt(OCT_6, t(20, 0)), OCT_9, { now: t(10, 7), minuteStep: 15, rules })).toEqual(
			dt(OCT_9, t(17, 30))
		);
	});
});

describe("applyTime", () => {
	test("from nothing it lands on the nearest allowed day", () => {
		expect(applyTime(null, t(15, 30), { today: OCT_5, rules: {} })).toEqual(dt(OCT_5, t(15, 30)));
	});

	test("keeps the date and swaps the time", () => {
		expect(applyTime(dt(OCT_9, t(9, 0)), t(15, 30), { today: OCT_5, rules: {} })).toEqual(dt(OCT_9, t(15, 30)));
	});

	test("clamps the time inside the date's bounds", () => {
		const rules = { maxDateTime: dt(OCT_9, t(17, 30)) };
		expect(applyTime(dt(OCT_9, t(9, 0)), t(20, 0), { today: OCT_5, rules })).toEqual(dt(OCT_9, t(17, 30)));
	});

	test("no allowed day leaves the value as it was", () => {
		const rules = { disabled: [{ type: "predicate", test: () => true }] } as const;
		expect(applyTime(null, t(15, 30), { today: OCT_5, rules })).toBeNull();
	});
});

describe("isDateTimeValid", () => {
	test("accepts a real value", () => {
		expect(isDateTimeValid(dt(OCT_5, t(15, 30)))).toBe(true);
	});

	test("refuses an impossible day or time", () => {
		expect(isDateTimeValid(dt(d(2026, 2, 30), t(15, 30)))).toBe(false);
		expect(isDateTimeValid(dt(OCT_5, t(24, 0)))).toBe(false);
	});

	test("refuses a value outside the rules", () => {
		const rules = { minDateTime: dt(OCT_5, t(9, 15)) };
		expect(isDateTimeValid(dt(OCT_5, t(9, 0)), rules)).toBe(false);
		expect(isDateTimeValid(dt(OCT_5, t(9, 15)), rules)).toBe(true);
		expect(isDateTimeValid(dt(OCT_10, t(9, 0)), { disabled: [{ type: "weekday", days: [6] }] })).toBe(false);
	});
});

describe("native Date interop", () => {
	test("toNativeDate reads local fields", () => {
		const native = toNativeDate(dt(OCT_5, t(15, 30)));
		expect(native.getFullYear()).toBe(2026);
		expect(native.getMonth()).toBe(9);
		expect(native.getDate()).toBe(5);
		expect(native.getHours()).toBe(15);
		expect(native.getMinutes()).toBe(30);
		expect(native.getSeconds()).toBe(0);
	});

	test("fromNativeDate drops seconds and milliseconds", () => {
		expect(fromNativeDate(new Date(2026, 9, 5, 15, 30, 42, 500))).toEqual(dt(OCT_5, t(15, 30)));
	});

	test("round trips local fields", () => {
		const value = dt(OCT_5, t(15, 30));
		expect(fromNativeDate(toNativeDate(value))).toEqual(value);
	});

	test("a year below 100 is not shifted into the 1900s", () => {
		expect(toNativeDate(dt(d(42, 3, 1), t(9, 0))).getFullYear()).toBe(42);
	});

	test("round trips across the NZ spring-forward day without moving the day or hour", () => {
		const previous = process.env.TZ;
		process.env.TZ = "Pacific/Auckland";
		try {
			const spring = d(2026, 9, 27);
			for (const time of [t(0, 0), t(1, 30), t(3, 0), t(15, 30), t(23, 59)]) {
				expect(fromNativeDate(toNativeDate(dt(spring, time)))).toEqual(dt(spring, time));
			}
		} finally {
			process.env.TZ = previous;
		}
	});
});

describe("formatDateTime", () => {
	test("en-US on a 12-hour clock reads PM", () => {
		const text = formatDateTime(dt(OCT_5, t(15, 30)), { locale: "en-US", hourCycle: 12 });
		expect(text).toContain("PM");
		expect(text).toContain("3:30");
		expect(text).toContain("Oct");
	});

	test("en-GB on a 24-hour clock reads 15:30", () => {
		const text = formatDateTime(dt(OCT_5, t(15, 30)), { locale: "en-GB", hourCycle: 24 });
		expect(text).toContain("15:30");
		expect(text).not.toContain("PM");
	});

	test("a forced hour cycle beats the locale's", () => {
		expect(formatDateTime(dt(OCT_5, t(15, 30)), { locale: "en-GB", hourCycle: 12 }).toLowerCase()).toContain("pm");
		expect(formatDateTime(dt(OCT_5, t(15, 30)), { locale: "en-US", hourCycle: 24 })).toContain("15:30");
	});

	test("the day does not move whatever the device's zone", () => {
		expect(formatDateTime(dt(OCT_5, t(0, 15)), { locale: "en-GB", hourCycle: 24 })).toContain("5");
	});

	test("an invalid locale does not throw", () => {
		expect(() => formatDateTime(dt(OCT_5, t(15, 30)), { locale: "not a locale!!", hourCycle: 24 })).not.toThrow();
		expect(formatDateTime(dt(OCT_5, t(15, 30)), { locale: "not a locale!!", hourCycle: 24 })).toContain("15:30");
	});
});

describe("formatDateTimeLong", () => {
	test("reads the full date, 'at', and the time", () => {
		expect(formatDateTimeLong(dt(OCT_5, t(15, 30)), { locale: "en-GB", hourCycle: 12 })).toMatch(
			/^Monday,? 5 October 2026 at 3:30\spm$/i
		);
	});
});

describe("serialise and parse", () => {
	test("writes YYYY-MM-DDTHH:mm", () => {
		expect(serialiseDateTime(dt(OCT_5, t(15, 30)))).toBe("2026-10-05T15:30");
		expect(serialiseDateTime(dt(OCT_5, t(7, 5, 9)))).toBe("2026-10-05T07:05:09");
	});

	test("reads YYYY-MM-DDTHH:mm and with seconds", () => {
		expect(parseDateTime("2026-10-05T15:30")).toEqual(dt(OCT_5, t(15, 30)));
		expect(parseDateTime("2026-10-05T07:05:09")).toEqual(dt(OCT_5, t(7, 5, 9)));
	});

	test("refuses malformed or out-of-range text", () => {
		expect(parseDateTime("2026-10-05")).toBeNull();
		expect(parseDateTime("2026-10-05 15:30")).toBeNull();
		expect(parseDateTime("2026-02-30T15:30")).toBeNull();
		expect(parseDateTime("2026-10-05T24:00")).toBeNull();
		expect(parseDateTime("2026-10-05T15:30Z")).toBeNull();
		expect(parseDateTime("")).toBeNull();
	});

	test("round trips", () => {
		const value = dt(OCT_5, t(15, 30));
		expect(parseDateTime(serialiseDateTime(value))).toEqual(value);
	});
});

describe("resolveCalendarBounds", () => {
	test("hands the calendar the bounds' days", () => {
		expect(resolveCalendarBounds({ minDateTime: dt(OCT_5, t(9, 0)), maxDateTime: dt(OCT_9, t(17, 0)) })).toEqual({
			minDate: OCT_5,
			maxDate: OCT_9,
		});
	});

	test("open bounds are undefined", () => {
		expect(resolveCalendarBounds({})).toEqual({ minDate: undefined, maxDate: undefined });
	});

	test("inverted bounds are dropped", () => {
		expect(resolveCalendarBounds({ minDateTime: dt(OCT_9, t(9, 0)), maxDateTime: dt(OCT_5, t(9, 0)) })).toEqual({
			minDate: undefined,
			maxDate: undefined,
		});
	});
});
