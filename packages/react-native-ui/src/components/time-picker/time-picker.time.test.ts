import { describe, expect, test } from "bun:test";
import {
	clampTime,
	compareTimes,
	displayHour,
	formatTime,
	fromMinutes,
	hourFromDisplay,
	hoursInBounds,
	isTimeDisabled,
	isValidTime,
	minutesForHour,
	nearestEnabledTime,
	parseTime,
	resolveDayPeriodLabels,
	resolveHourCycle,
	resolveInitialTime,
	serialiseTime,
	snapMinute,
	snapTime,
	type TimeValue,
	to12Hour,
	to24Hour,
	toMinutes,
} from "./time-picker.time";

const t = (hour: number, minute: number, second?: number): TimeValue =>
	second === undefined ? { hour, minute } : { hour, minute, second };

describe("isValidTime", () => {
	test("accepts every in-range integer time", () => {
		expect(isValidTime(t(0, 0))).toBe(true);
		expect(isValidTime(t(23, 59, 59))).toBe(true);
	});

	test("rejects out-of-range and fractional fields", () => {
		expect(isValidTime(t(24, 0))).toBe(false);
		expect(isValidTime(t(-1, 0))).toBe(false);
		expect(isValidTime(t(12, 60))).toBe(false);
		expect(isValidTime(t(12, 30, 60))).toBe(false);
		expect(isValidTime(t(12.5, 0))).toBe(false);
	});
});

describe("compareTimes", () => {
	test("orders by hour, then minute, then second", () => {
		expect(compareTimes(t(9, 0), t(10, 0))).toBeLessThan(0);
		expect(compareTimes(t(10, 30), t(10, 5))).toBeGreaterThan(0);
		expect(compareTimes(t(10, 30, 1), t(10, 30))).toBeGreaterThan(0);
		expect(compareTimes(t(10, 30, 0), t(10, 30))).toBe(0);
	});
});

describe("toMinutes / fromMinutes", () => {
	test("round trip across the day", () => {
		for (let minutes = 0; minutes < 1440; minutes += 7) {
			expect(toMinutes(fromMinutes(minutes))).toBe(minutes);
		}
	});

	test("wrap outside the day", () => {
		expect(fromMinutes(1440)).toEqual(t(0, 0));
		expect(fromMinutes(-1)).toEqual(t(23, 59));
	});
});

describe("to12Hour / to24Hour", () => {
	test("midnight is 12 AM and noon is 12 PM", () => {
		expect(to12Hour(0)).toEqual({ hour12: 12, period: "am" });
		expect(to12Hour(12)).toEqual({ hour12: 12, period: "pm" });
		expect(to12Hour(13)).toEqual({ hour12: 1, period: "pm" });
		expect(to12Hour(11)).toEqual({ hour12: 11, period: "am" });
	});

	test("12 AM is hour 0 and 12 PM is hour 12", () => {
		expect(to24Hour(12, "am")).toBe(0);
		expect(to24Hour(12, "pm")).toBe(12);
		expect(to24Hour(1, "pm")).toBe(13);
	});

	test("round trip for all 24 hours", () => {
		for (let hour = 0; hour < 24; hour++) {
			const { hour12, period } = to12Hour(hour);
			expect(to24Hour(hour12, period)).toBe(hour);
		}
	});
});

describe("displayHour / hourFromDisplay", () => {
	test("24-hour display is the stored hour", () => {
		expect(displayHour(0, 24)).toBe(0);
		expect(displayHour(15, 24)).toBe(15);
		expect(hourFromDisplay(15, 24, "am")).toBe(15);
	});

	test("12-hour display maps through the period", () => {
		expect(displayHour(0, 12)).toBe(12);
		expect(displayHour(15, 12)).toBe(3);
		expect(hourFromDisplay(3, 12, "pm")).toBe(15);
		expect(hourFromDisplay(12, 12, "am")).toBe(0);
	});

	test("round trip for all 24 hours in both cycles", () => {
		for (let hour = 0; hour < 24; hour++) {
			const period = to12Hour(hour).period;
			expect(hourFromDisplay(displayHour(hour, 12), 12, period)).toBe(hour);
			expect(hourFromDisplay(displayHour(hour, 24), 24, period)).toBe(hour);
		}
	});
});

describe("snapMinute", () => {
	test("rounds to the nearest step", () => {
		expect(snapMinute(7, 5)).toBe(5);
		expect(snapMinute(8, 5)).toBe(10);
		expect(snapMinute(52, 15)).toBe(45);
		expect(snapMinute(53, 15)).toBe(60);
		expect(snapMinute(37, 1)).toBe(37);
	});

	test("may return 60, for snapTime to carry", () => {
		expect(snapMinute(53, 30)).toBe(60);
	});
});

describe("snapTime", () => {
	test("leaves an on-step time alone", () => {
		expect(snapTime(t(9, 30), 15)).toEqual(t(9, 30));
	});

	test("carries a rounded-up minute into the hour", () => {
		expect(snapTime(t(9, 53), 30)).toEqual(t(10, 0));
		expect(snapTime(t(9, 59), 15)).toEqual(t(10, 0));
	});

	test("clamps at the end of the day rather than wrapping to midnight", () => {
		expect(snapTime(t(23, 59), 15)).toEqual(t(23, 45));
		expect(snapTime(t(23, 58), 5)).toEqual(t(23, 55));
	});

	test("keeps seconds when the time carries them", () => {
		expect(snapTime(t(9, 7, 42), 5)).toEqual(t(9, 5, 42));
	});
});

describe("clampTime", () => {
	const min = t(9, 0);
	const max = t(17, 30);

	test("inside bounds is unchanged", () => {
		expect(clampTime(t(12, 0), min, max)).toEqual(t(12, 0));
	});

	test("below and above clamp to the bound", () => {
		expect(clampTime(t(8, 15), min, max)).toEqual(min);
		expect(clampTime(t(18, 0), min, max)).toEqual(max);
	});

	test("a single bound clamps on its side only", () => {
		expect(clampTime(t(8, 0), min, undefined)).toEqual(min);
		expect(clampTime(t(20, 0), min, undefined)).toEqual(t(20, 0));
	});

	test("min after max is treated as unbounded", () => {
		expect(clampTime(t(3, 0), max, min)).toEqual(t(3, 0));
	});
});

describe("isTimeDisabled", () => {
	test("outside bounds is disabled, the bounds themselves are not", () => {
		const bounds = { minTime: t(9, 0), maxTime: t(17, 0) };
		expect(isTimeDisabled(t(8, 59), bounds)).toBe(true);
		expect(isTimeDisabled(t(9, 0), bounds)).toBe(false);
		expect(isTimeDisabled(t(17, 0), bounds)).toBe(false);
		expect(isTimeDisabled(t(17, 1), bounds)).toBe(true);
	});

	test("no bounds disables nothing", () => {
		expect(isTimeDisabled(t(3, 0), {})).toBe(false);
	});
});

describe("minutesForHour", () => {
	test("every step when unbounded", () => {
		expect(minutesForHour(10, 15, {})).toEqual([0, 15, 30, 45]);
		expect(minutesForHour(10, 1, {})).toHaveLength(60);
	});

	test("starts at the bound in the minimum's hour", () => {
		expect(minutesForHour(9, 5, { minTime: t(9, 20) })[0]).toBe(20);
	});

	test("ends at the bound in the maximum's hour", () => {
		expect(minutesForHour(17, 15, { maxTime: t(17, 30) })).toEqual([0, 15, 30]);
	});

	test("an hour wholly outside bounds has none", () => {
		expect(minutesForHour(8, 5, { minTime: t(9, 0) })).toEqual([]);
	});
});

describe("hoursInBounds", () => {
	test("every hour when unbounded", () => {
		expect(hoursInBounds({})).toHaveLength(24);
	});

	test("only hours with an enabled minute", () => {
		expect(hoursInBounds({ minTime: t(9, 20), maxTime: t(11, 10) })).toEqual([9, 10, 11]);
	});

	test("respects the step", () => {
		expect(hoursInBounds({ minTime: t(9, 50), maxTime: t(11, 10) }, 30)).toEqual([10, 11]);
	});
});

describe("nearestEnabledTime", () => {
	test("an enabled on-step time is unchanged", () => {
		expect(nearestEnabledTime(t(10, 30), 15, {})).toEqual(t(10, 30));
	});

	test("snaps then pulls inside the bounds", () => {
		const bounds = { minTime: t(9, 20), maxTime: t(17, 0) };
		expect(nearestEnabledTime(t(8, 0), 15, bounds)).toEqual(t(9, 30));
		expect(nearestEnabledTime(t(18, 0), 15, bounds)).toEqual(t(17, 0));
		expect(nearestEnabledTime(t(9, 21), 5, bounds)).toEqual(t(9, 20));
	});

	test("bounds that hold no step fall back to the clamped time", () => {
		const bounds = { minTime: t(9, 1), maxTime: t(9, 4) };
		expect(nearestEnabledTime(t(12, 0), 5, bounds)).toEqual(t(9, 4));
	});
});

describe("resolveInitialTime", () => {
	test("snaps now to the step", () => {
		expect(resolveInitialTime(t(14, 22, 31), 5, {})).toEqual(t(14, 20));
	});

	test("clamps into the bounds", () => {
		expect(resolveInitialTime(t(6, 0), 15, { minTime: t(9, 0) })).toEqual(t(9, 0));
	});

	test("keeps a seconds field at zero when asked for one", () => {
		expect(resolveInitialTime(t(14, 22, 31), 1, {}, true)).toEqual(t(14, 22, 0));
	});
});

describe("resolveHourCycle", () => {
	test("en-US is 12-hour and en-GB is 24-hour", () => {
		expect(resolveHourCycle("en-US")).toBe(12);
		expect(resolveHourCycle("en-GB")).toBe(24);
	});

	test("an invalid locale does not throw", () => {
		expect(() => resolveHourCycle("not a locale!!")).not.toThrow();
		expect([12, 24]).toContain(resolveHourCycle("not a locale!!"));
	});
});

describe("resolveDayPeriodLabels", () => {
	test("en-US reads AM and PM", () => {
		expect(resolveDayPeriodLabels("en-US")).toEqual({ am: "AM", pm: "PM" });
	});

	test("an invalid locale falls back", () => {
		expect(resolveDayPeriodLabels("not a locale!!")).toEqual({ am: "AM", pm: "PM" });
	});
});

describe("formatTime", () => {
	test("12-hour en-US", () => {
		const text = formatTime(t(15, 5), { locale: "en-US", hourCycle: 12 });
		expect(text).toContain("3:05");
		expect(text).toContain("PM");
	});

	test("12 AM, not 0 AM", () => {
		expect(formatTime(t(0, 30), { locale: "en-US", hourCycle: 12 })).toContain("12:30");
	});

	test("24-hour en-GB", () => {
		expect(formatTime(t(15, 5), { locale: "en-GB", hourCycle: 24 })).toBe("15:05");
	});

	test("midnight in 24-hour is 00, not 24", () => {
		expect(formatTime(t(0, 5), { locale: "en-US", hourCycle: 24 })).toBe("00:05");
	});

	test("seconds when the value carries them", () => {
		expect(formatTime(t(15, 5, 9), { locale: "en-GB", hourCycle: 24 })).toBe("15:05:09");
	});

	test("an invalid locale does not throw", () => {
		expect(formatTime(t(15, 5), { locale: "not a locale!!", hourCycle: 24 })).toBe("15:05");
	});
});

describe("parseTime / serialiseTime", () => {
	test("parses HH:mm and HH:mm:ss", () => {
		expect(parseTime("09:05")).toEqual(t(9, 5));
		expect(parseTime("23:59:30")).toEqual(t(23, 59, 30));
	});

	test("rejects anything else", () => {
		expect(parseTime("24:00")).toBeNull();
		expect(parseTime("9:5")).toBeNull();
		expect(parseTime("noon")).toBeNull();
	});

	test("serialises zero-padded, seconds only when present", () => {
		expect(serialiseTime(t(9, 5))).toBe("09:05");
		expect(serialiseTime(t(9, 5, 3))).toBe("09:05:03");
	});

	test("round trip", () => {
		for (const text of ["00:00", "12:30", "23:59:59"]) {
			const parsed = parseTime(text);
			expect(parsed).not.toBeNull();
			if (parsed) expect(serialiseTime(parsed)).toBe(text);
		}
	});
});
