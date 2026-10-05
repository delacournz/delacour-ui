import { describe, expect, test } from "bun:test";
import {
	addDays,
	addMonths,
	addYears,
	applyRangeTap,
	applySingleTap,
	type CalendarDate,
	type CalendarDateRange,
	clampDate,
	compareDates,
	compareMonths,
	daysInMonth,
	formatDate,
	formatDateRange,
	formatMonthYear,
	fromDate,
	isBetween,
	isDateDisabled,
	isLeapYear,
	isSameDay,
	isSameMonth,
	isValidDate,
	matchesDisabled,
	monthGrid,
	monthNames,
	nextSelection,
	normaliseRange,
	parseDate,
	rangeContainsDisabled,
	resolveWeekStart,
	resolveYearSpan,
	serialiseDate,
	startOfMonth,
	toDate,
	today,
	toggleMultiple,
	weekdayLabels,
	weekdayOf,
	weekStartFromRegion,
} from "./calendar.date";

/** A date literal that reads like the calendar it names. */
function d(year: number, month: number, day: number): CalendarDate {
	return { year, month, day };
}

const EMPTY_RANGE: CalendarDateRange = { start: null, end: null };

describe("isLeapYear and daysInMonth", () => {
	test("follows the Gregorian century rule", () => {
		expect(isLeapYear(2024)).toBe(true);
		expect(isLeapYear(2100)).toBe(false);
		expect(isLeapYear(2000)).toBe(true);
		expect(isLeapYear(2026)).toBe(false);
	});

	test("counts each month's days", () => {
		expect(daysInMonth(2024, 2)).toBe(29);
		expect(daysInMonth(2100, 2)).toBe(28);
		expect(daysInMonth(2000, 2)).toBe(29);
		expect(daysInMonth(2026, 4)).toBe(30);
		expect(daysInMonth(2026, 1)).toBe(31);
		expect(daysInMonth(2026, 12)).toBe(31);
	});
});

describe("isValidDate", () => {
	test("accepts a real day and rejects one that is not", () => {
		expect(isValidDate(d(2024, 2, 29))).toBe(true);
		expect(isValidDate(d(2026, 2, 29))).toBe(false);
		expect(isValidDate(d(2026, 13, 1))).toBe(false);
		expect(isValidDate(d(2026, 0, 1))).toBe(false);
		expect(isValidDate(d(2026, 4, 31))).toBe(false);
		expect(isValidDate(d(2026, 1, 0))).toBe(false);
		expect(isValidDate(d(2026, 1, 1.5))).toBe(false);
		expect(isValidDate(d(Number.NaN, 1, 1))).toBe(false);
	});
});

describe("comparison", () => {
	test("compareDates orders by year, then month, then day", () => {
		expect(compareDates(d(2026, 10, 5), d(2026, 10, 5))).toBe(0);
		expect(compareDates(d(2026, 10, 4), d(2026, 10, 5))).toBeLessThan(0);
		expect(compareDates(d(2026, 11, 1), d(2026, 10, 31))).toBeGreaterThan(0);
		expect(compareDates(d(2025, 12, 31), d(2026, 1, 1))).toBeLessThan(0);
	});

	test("compareMonths ignores the day", () => {
		expect(compareMonths(d(2026, 10, 1), d(2026, 10, 31))).toBe(0);
		expect(compareMonths(d(2026, 9, 30), d(2026, 10, 1))).toBeLessThan(0);
	});

	test("isSameDay and isSameMonth", () => {
		expect(isSameDay(d(2026, 10, 5), d(2026, 10, 5))).toBe(true);
		expect(isSameDay(d(2026, 10, 5), d(2026, 10, 6))).toBe(false);
		expect(isSameDay(d(2026, 10, 5), null)).toBe(false);
		expect(isSameMonth(d(2026, 10, 5), d(2026, 10, 30))).toBe(true);
		expect(isSameMonth(d(2026, 10, 5), d(2025, 10, 5))).toBe(false);
	});

	test("isBetween is inclusive and takes its ends in either order", () => {
		expect(isBetween(d(2026, 10, 5), d(2026, 10, 5), d(2026, 10, 9))).toBe(true);
		expect(isBetween(d(2026, 10, 9), d(2026, 10, 5), d(2026, 10, 9))).toBe(true);
		expect(isBetween(d(2026, 10, 7), d(2026, 10, 9), d(2026, 10, 5))).toBe(true);
		expect(isBetween(d(2026, 10, 10), d(2026, 10, 5), d(2026, 10, 9))).toBe(false);
	});
});

describe("weekdayOf", () => {
	test("needs no Date to find the weekday", () => {
		expect(weekdayOf(d(2026, 10, 5))).toBe(1);
		expect(weekdayOf(d(2000, 1, 1))).toBe(6);
		expect(weekdayOf(d(2026, 2, 1))).toBe(0);
		expect(weekdayOf(d(1970, 1, 1))).toBe(4);
		expect(weekdayOf(d(2024, 2, 29))).toBe(4);
	});

	test("agrees with the platform for every day of a leap year", () => {
		let day = d(2024, 1, 1);
		for (let i = 0; i < 366; i += 1) {
			expect<number>(weekdayOf(day)).toBe(new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay());
			day = addDays(day, 1);
		}
	});
});

describe("arithmetic", () => {
	test("addDays crosses month, year and leap boundaries, both ways", () => {
		expect(addDays(d(2026, 10, 31), 1)).toEqual(d(2026, 11, 1));
		expect(addDays(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
		expect(addDays(d(2024, 2, 28), 1)).toEqual(d(2024, 2, 29));
		expect(addDays(d(2024, 2, 29), 1)).toEqual(d(2024, 3, 1));
		expect(addDays(d(2026, 1, 1), -1)).toEqual(d(2025, 12, 31));
		expect(addDays(d(2024, 3, 1), -1)).toEqual(d(2024, 2, 29));
		expect(addDays(d(2026, 10, 5), 365)).toEqual(d(2027, 10, 5));
		expect(addDays(d(2026, 10, 5), 0)).toEqual(d(2026, 10, 5));
	});

	test("addMonths clamps the day to the month it lands in", () => {
		expect(addMonths(d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28));
		expect(addMonths(d(2024, 1, 31), 1)).toEqual(d(2024, 2, 29));
		expect(addMonths(d(2026, 3, 15), -3)).toEqual(d(2025, 12, 15));
		expect(addMonths(d(2026, 11, 30), 14)).toEqual(d(2028, 1, 30));
		expect(addMonths(d(2026, 1, 1), -13)).toEqual(d(2024, 12, 1));
	});

	test("addYears clamps 29 February", () => {
		expect(addYears(d(2024, 2, 29), 1)).toEqual(d(2025, 2, 28));
		expect(addYears(d(2026, 10, 5), -26)).toEqual(d(2000, 10, 5));
	});

	test("startOfMonth", () => {
		expect(startOfMonth(d(2026, 10, 17))).toEqual(d(2026, 10, 1));
	});

	test("clampDate holds a day inside optional bounds", () => {
		expect(clampDate(d(2026, 10, 5), d(2026, 10, 10), d(2026, 10, 20))).toEqual(d(2026, 10, 10));
		expect(clampDate(d(2026, 10, 25), d(2026, 10, 10), d(2026, 10, 20))).toEqual(d(2026, 10, 20));
		expect(clampDate(d(2026, 10, 15), d(2026, 10, 10), d(2026, 10, 20))).toEqual(d(2026, 10, 15));
		expect(clampDate(d(2026, 10, 5), undefined, undefined)).toEqual(d(2026, 10, 5));
	});
});

describe("monthGrid", () => {
	test("is always six weeks of seven days", () => {
		for (let month = 1; month <= 12; month += 1) {
			for (const start of [0, 1, 6] as const) {
				const grid = monthGrid(d(2026, month, 1), start);
				expect(grid).toHaveLength(6);
				for (const week of grid) expect(week).toHaveLength(7);
			}
		}
	});

	test("October 2026 from Sunday leads with four September days", () => {
		const grid = monthGrid(d(2026, 10, 1), 0);
		expect(grid[0]?.map((cell) => cell.date.day)).toEqual([27, 28, 29, 30, 1, 2, 3]);
		expect(grid[0]?.map((cell) => cell.isOutside)).toEqual([true, true, true, true, false, false, false]);
		expect(grid[0]?.[0]?.date).toEqual(d(2026, 9, 27));
		expect(grid[5]?.[6]?.date).toEqual(d(2026, 11, 7));
	});

	test("October 2026 from Monday leads with three September days", () => {
		const grid = monthGrid(d(2026, 10, 1), 1);
		expect(grid[0]?.map((cell) => cell.date.day)).toEqual([28, 29, 30, 1, 2, 3, 4]);
		expect(grid[0]?.[3]?.isOutside).toBe(false);
	});

	test("a month starting on the first column has no leading week", () => {
		const grid = monthGrid(d(2026, 2, 1), 0);
		expect(grid[0]?.[0]?.date).toEqual(d(2026, 2, 1));
		const insideRows = grid.filter((week) => week.every((cell) => !cell.isOutside));
		const outsideRows = grid.filter((week) => week.every((cell) => cell.isOutside));
		expect(insideRows).toHaveLength(4);
		expect(outsideRows).toHaveLength(2);
	});

	test("numbers every cell by its week and column", () => {
		const grid = monthGrid(d(2026, 10, 1), 1);
		expect(grid[2]?.[4]).toMatchObject({ weekIndex: 2, dayIndex: 4 });
	});

	test("ignores the day of the month it is handed", () => {
		expect(monthGrid(d(2026, 10, 31), 0)).toEqual(monthGrid(d(2026, 10, 1), 0));
	});
});

describe("Date conversion", () => {
	test("round-trips through local fields, never UTC", () => {
		const date = toDate(d(2026, 10, 5));
		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(9);
		expect(date.getDate()).toBe(5);
		expect(fromDate(date)).toEqual(d(2026, 10, 5));
		expect(fromDate(new Date(2026, 0, 1, 23, 59))).toEqual(d(2026, 1, 1));
	});

	test("today is a valid date", () => {
		expect(isValidDate(today())).toBe(true);
	});
});

describe("disabled matchers", () => {
	test("matches a date, an open span, a weekday and a predicate", () => {
		expect(matchesDisabled(d(2026, 10, 5), [{ type: "date", date: d(2026, 10, 5) }])).toBe(true);
		expect(matchesDisabled(d(2026, 10, 6), [{ type: "date", date: d(2026, 10, 5) }])).toBe(false);
		expect(matchesDisabled(d(2026, 10, 5), [{ type: "span", from: d(2026, 10, 1), to: null }])).toBe(true);
		expect(matchesDisabled(d(2026, 9, 30), [{ type: "span", from: d(2026, 10, 1), to: null }])).toBe(false);
		expect(matchesDisabled(d(1990, 1, 1), [{ type: "span", from: null, to: d(2026, 10, 1) }])).toBe(true);
		expect(matchesDisabled(d(2026, 10, 10), [{ type: "weekday", days: [0, 6] }])).toBe(true);
		expect(matchesDisabled(d(2026, 10, 9), [{ type: "weekday", days: [0, 6] }])).toBe(false);
		expect(matchesDisabled(d(2026, 10, 13), [{ type: "predicate", test: (date) => date.day === 13 }])).toBe(true);
		expect(matchesDisabled(d(2026, 10, 13), [])).toBe(false);
	});

	test("isDateDisabled treats min and max as inclusive", () => {
		const bounds = { minDate: d(2026, 10, 5), maxDate: d(2026, 10, 20) };
		expect(isDateDisabled(d(2026, 10, 5), bounds)).toBe(false);
		expect(isDateDisabled(d(2026, 10, 20), bounds)).toBe(false);
		expect(isDateDisabled(d(2026, 10, 4), bounds)).toBe(true);
		expect(isDateDisabled(d(2026, 10, 21), bounds)).toBe(true);
		expect(isDateDisabled(d(2026, 10, 10), { ...bounds, disabled: [{ type: "weekday", days: [6] }] })).toBe(true);
		expect(isDateDisabled(d(2026, 10, 10), {})).toBe(false);
	});
});

describe("range selection", () => {
	test("normaliseRange swaps an end that falls before its start", () => {
		expect(normaliseRange(d(2026, 10, 9), d(2026, 10, 5))).toEqual({ start: d(2026, 10, 5), end: d(2026, 10, 9) });
		expect(normaliseRange(d(2026, 10, 5), d(2026, 10, 9))).toEqual({ start: d(2026, 10, 5), end: d(2026, 10, 9) });
	});

	test("the first tap starts a range", () => {
		expect(applyRangeTap(EMPTY_RANGE, d(2026, 10, 5))).toEqual({ start: d(2026, 10, 5), end: null });
	});

	test("a later second tap completes it", () => {
		expect(applyRangeTap({ start: d(2026, 10, 5), end: null }, d(2026, 10, 9))).toEqual({
			start: d(2026, 10, 5),
			end: d(2026, 10, 9),
		});
	});

	test("an earlier second tap moves the start", () => {
		expect(applyRangeTap({ start: d(2026, 10, 5), end: null }, d(2026, 10, 2))).toEqual({
			start: d(2026, 10, 2),
			end: null,
		});
	});

	test("the same day twice is a one-day range", () => {
		expect(applyRangeTap({ start: d(2026, 10, 5), end: null }, d(2026, 10, 5))).toEqual({
			start: d(2026, 10, 5),
			end: d(2026, 10, 5),
		});
	});

	test("a tap on a complete range starts again", () => {
		expect(applyRangeTap({ start: d(2026, 10, 5), end: d(2026, 10, 9) }, d(2026, 10, 7))).toEqual({
			start: d(2026, 10, 7),
			end: null,
		});
	});

	test("rangeContainsDisabled finds a disabled day inside, ends included", () => {
		const isWeekend = (date: CalendarDate) => weekdayOf(date) === 0 || weekdayOf(date) === 6;
		expect(rangeContainsDisabled(d(2026, 10, 5), d(2026, 10, 9), isWeekend)).toBe(false);
		expect(rangeContainsDisabled(d(2026, 10, 5), d(2026, 10, 12), isWeekend)).toBe(true);
		expect(rangeContainsDisabled(d(2026, 10, 12), d(2026, 10, 5), isWeekend)).toBe(true);
	});
});

describe("single and multiple selection", () => {
	test("a tap on the selected day clears it", () => {
		expect(applySingleTap(null, d(2026, 10, 5))).toEqual(d(2026, 10, 5));
		expect(applySingleTap(d(2026, 10, 5), d(2026, 10, 6))).toEqual(d(2026, 10, 6));
		expect(applySingleTap(d(2026, 10, 5), d(2026, 10, 5))).toBeNull();
	});

	test("toggleMultiple adds in order and removes on a second tap", () => {
		const once = toggleMultiple([d(2026, 10, 9), d(2026, 10, 1)], d(2026, 10, 5));
		expect(once).toEqual([d(2026, 10, 1), d(2026, 10, 5), d(2026, 10, 9)]);
		expect(toggleMultiple(once, d(2026, 10, 5))).toEqual([d(2026, 10, 1), d(2026, 10, 9)]);
	});

	test("toggleMultiple drops duplicates it is handed", () => {
		expect(toggleMultiple([d(2026, 10, 1), d(2026, 10, 1)], d(2026, 10, 2))).toEqual([d(2026, 10, 1), d(2026, 10, 2)]);
	});
});

describe("nextSelection", () => {
	const never = () => false;

	test("dispatches on the mode", () => {
		expect(nextSelection({ mode: "single", value: null }, d(2026, 10, 5), never)).toEqual({
			mode: "single",
			value: d(2026, 10, 5),
		});
		expect(nextSelection({ mode: "multiple", value: [] }, d(2026, 10, 5), never)).toEqual({
			mode: "multiple",
			value: [d(2026, 10, 5)],
		});
		expect(nextSelection({ mode: "range", value: EMPTY_RANGE }, d(2026, 10, 5), never)).toEqual({
			mode: "range",
			value: { start: d(2026, 10, 5), end: null },
		});
	});

	test("a range that would swallow a disabled day restarts at the tap", () => {
		const isTenth = (date: CalendarDate) => date.day === 10;
		expect(
			nextSelection({ mode: "range", value: { start: d(2026, 10, 5), end: null } }, d(2026, 10, 12), isTenth)
		).toEqual({ mode: "range", value: { start: d(2026, 10, 12), end: null } });
	});
});

describe("week start", () => {
	test("follows the locale", () => {
		expect(resolveWeekStart("en-US")).toBe(0);
		expect(resolveWeekStart("en-NZ")).toBe(1);
		expect(resolveWeekStart("de-DE")).toBe(1);
		expect(resolveWeekStart("ar-EG")).toBe(6);
	});

	test("falls back to Monday for a locale it cannot read", () => {
		expect(resolveWeekStart("not a locale!!")).toBe(1);
	});

	test("the region table stands in where Intl has no week info", () => {
		expect(weekStartFromRegion("US")).toBe(0);
		expect(weekStartFromRegion("NZ")).toBe(1);
		expect(weekStartFromRegion("EG")).toBe(6);
		expect(weekStartFromRegion("MV")).toBe(5);
		expect(weekStartFromRegion(undefined)).toBe(1);
	});
});

describe("labels", () => {
	test("weekdayLabels starts on the week start", () => {
		const sunday = weekdayLabels("en-US", 0, "short");
		const monday = weekdayLabels("en-US", 1, "short");
		expect(sunday).toHaveLength(7);
		expect(sunday[0]).toBe("Sun");
		expect(monday[0]).toBe("Mon");
		expect(monday[6]).toBe("Sun");
		expect(weekdayLabels("en-US", 1, "long")[0]).toBe("Monday");
		expect(weekdayLabels("en-US", 1, "narrow")[0]).toBe("M");
	});

	test("monthNames lists twelve months from January", () => {
		const names = monthNames("en-NZ");
		expect(names).toHaveLength(12);
		expect(names[0]).toBe("January");
		expect(monthNames("en-NZ", "short")[9]).toBe("Oct");
	});
});

describe("formatters", () => {
	test("formatDate renders the style asked for", () => {
		const medium = formatDate(d(2026, 10, 5), { locale: "en-NZ", style: "medium" });
		expect(medium).toContain("Oct");
		expect(medium).toContain("2026");
		expect(formatDate(d(2026, 10, 5), { locale: "en-NZ", style: "full" })).toContain("Monday");
	});

	test("another locale reads differently", () => {
		const nz = formatDate(d(2026, 10, 5), { locale: "en-NZ", style: "long" });
		const jp = formatDate(d(2026, 10, 5), { locale: "ja-JP", style: "long" });
		expect(jp).not.toBe(nz);
	});

	test("never shifts the day, whatever the time zone", () => {
		expect(formatDate(d(2026, 1, 1), { locale: "en-US", style: "short" })).toBe("1/1/2026");
	});

	test("never throws on a locale it cannot read", () => {
		expect(() => formatDate(d(2026, 10, 5), { locale: "not a locale!!", style: "medium" })).not.toThrow();
		expect(formatDate(d(2026, 10, 5), { locale: "not a locale!!", style: "medium" })).toContain("2026");
		expect(() => weekdayLabels("not a locale!!", 1, "short")).not.toThrow();
	});

	test("formatMonthYear names the month and the year", () => {
		expect(formatMonthYear(d(2026, 10, 5), "en-NZ")).toBe("October 2026");
	});

	test("formatDateRange covers empty, open and complete ranges", () => {
		expect(formatDateRange(EMPTY_RANGE, { locale: "en-NZ", style: "medium" })).toBe("");
		const open = formatDateRange({ start: d(2026, 10, 5), end: null }, { locale: "en-NZ", style: "medium" });
		expect(open).toContain("5");
		const full = formatDateRange({ start: d(2026, 10, 5), end: d(2026, 10, 9) }, { locale: "en-NZ", style: "medium" });
		expect(full).toContain("9");
		expect(full).toContain("5");
		const same = formatDateRange({ start: d(2026, 10, 5), end: d(2026, 10, 5) }, { locale: "en-NZ", style: "medium" });
		expect(same).toBe(formatDate(d(2026, 10, 5), { locale: "en-NZ", style: "medium" }));
	});
});

describe("ISO serialisation", () => {
	test("serialiseDate zero-pads", () => {
		expect(serialiseDate(d(2026, 1, 5))).toBe("2026-01-05");
		expect(serialiseDate(d(987, 12, 31))).toBe("0987-12-31");
	});

	test("parseDate is strict", () => {
		expect(parseDate("2026-10-05")).toEqual(d(2026, 10, 5));
		expect(parseDate("2026-02-29")).toBeNull();
		expect(parseDate("2026-1-05")).toBeNull();
		expect(parseDate("2026-10-05T00:00:00Z")).toBeNull();
		expect(parseDate("")).toBeNull();
	});

	test("round-trips", () => {
		expect(parseDate(serialiseDate(d(2024, 2, 29)))).toEqual(d(2024, 2, 29));
	});
});

describe("resolveYearSpan", () => {
	test("reaches from the start month's year to the end month's", () => {
		expect(resolveYearSpan({ visible: d(2026, 10, 1), startMonth: d(2020, 1, 1), endMonth: d(2030, 1, 1) })).toEqual({
			from: 2020,
			to: 2030,
		});
	});

	test("reaches a century either side when unbounded", () => {
		expect(resolveYearSpan({ visible: d(2026, 10, 1) })).toEqual({ from: 1926, to: 2126 });
	});
});
