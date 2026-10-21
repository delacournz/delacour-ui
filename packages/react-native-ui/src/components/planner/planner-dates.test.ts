import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	addDays,
	addMonths,
	buildMonthGrid,
	buildWeekRange,
	formatMonthTitle,
	fromDayKey,
	isSameMonth,
	msUntilNextMidnight,
	PLANNER_GRID_DAYS,
	PLANNER_WEEK_STARTS,
	type PlannerWeekStart,
	resolveWeekStart,
	startOfMonth,
	startOfWeek,
	toDayKey,
	weekdayLabels,
} from "./planner-dates";

/**
 * Every test here runs in Auckland, whose clocks jump in April and September,
 * so a calendar built from timestamps would visibly put an entry on the wrong
 * day. `TZ` is read per call by Bun's `Date`, so setting it here is enough.
 */
const previousTimeZone = process.env.TZ;
beforeAll(() => {
	process.env.TZ = "Pacific/Auckland";
});
afterAll(() => {
	process.env.TZ = previousTimeZone;
});

describe("toDayKey", () => {
	test("a Date is keyed by its local calendar day", () => {
		expect(toDayKey(new Date(2026, 9, 14))).toBe("2026-10-14");
		expect(toDayKey(new Date(2026, 9, 14, 23, 59, 59))).toBe("2026-10-14");
		expect(toDayKey(new Date(2026, 0, 1, 0, 0, 0))).toBe("2026-01-01");
	});

	test("a YYYY-MM-DD string is taken as written, never parsed as UTC", () => {
		// `new Date("2026-04-05")` is UTC midnight — the 5th in London, the 5th at
		// 13:00 in Auckland, and the 4th in Los Angeles. The key must not move.
		expect(toDayKey("2026-04-05")).toBe("2026-04-05");
		expect(toDayKey("2024-02-29")).toBe("2024-02-29");
	});

	test("a malformed string throws rather than landing on a guess", () => {
		expect(() => toDayKey("14/10/2026")).toThrow();
		expect(() => toDayKey("2026-13-01")).toThrow();
		expect(() => toDayKey("2026-02-30")).toThrow();
	});

	test("round-trips through fromDayKey across both NZ daylight-saving changes", () => {
		for (const key of ["2026-04-04", "2026-04-05", "2026-04-06", "2026-09-26", "2026-09-27", "2026-09-28"]) {
			expect(toDayKey(fromDayKey(key))).toBe(key);
		}
	});
});

describe("fromDayKey", () => {
	test("is local midnight of that day", () => {
		const date = fromDayKey("2026-09-27");
		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(8);
		expect(date.getDate()).toBe(27);
		expect(date.getHours()).toBe(0);
	});
});

describe("startOfMonth / addMonths / isSameMonth", () => {
	test("startOfMonth is the 1st at local midnight", () => {
		expect(toDayKey(startOfMonth(new Date(2026, 9, 31, 18)))).toBe("2026-10-01");
	});

	test("addMonths clamps the 31st to the last day of a shorter month", () => {
		expect(toDayKey(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-28");
		expect(toDayKey(addMonths(new Date(2024, 0, 31), 1))).toBe("2024-02-29");
		expect(toDayKey(addMonths(new Date(2026, 2, 31), -1))).toBe("2026-02-28");
		expect(toDayKey(addMonths(new Date(2026, 4, 31), 1))).toBe("2026-06-30");
	});

	test("addMonths crosses years both ways", () => {
		expect(toDayKey(addMonths(new Date(2026, 11, 15), 1))).toBe("2027-01-15");
		expect(toDayKey(addMonths(new Date(2026, 0, 15), -1))).toBe("2025-12-15");
		expect(toDayKey(addMonths(new Date(2026, 0, 15), -25))).toBe("2023-12-15");
	});

	test("isSameMonth compares calendar months, not timestamps", () => {
		expect(isSameMonth(new Date(2026, 9, 1), new Date(2026, 9, 31, 23))).toBe(true);
		expect(isSameMonth(new Date(2026, 9, 1), new Date(2025, 9, 1))).toBe(false);
	});
});

describe("addDays", () => {
	test("steps one calendar day across a daylight-saving change, not 24 hours", () => {
		// 5 April 2026 is 25 hours long in Auckland; 27 September is 23.
		expect(toDayKey(addDays(new Date(2026, 3, 4), 1))).toBe("2026-04-05");
		expect(toDayKey(addDays(new Date(2026, 3, 5), 1))).toBe("2026-04-06");
		expect(toDayKey(addDays(new Date(2026, 8, 26), 1))).toBe("2026-09-27");
		expect(toDayKey(addDays(new Date(2026, 8, 27), 1))).toBe("2026-09-28");
		expect(toDayKey(addDays(new Date(2026, 8, 28), -2))).toBe("2026-09-26");
	});
});

describe("startOfWeek", () => {
	test("finds the first day of the week for every week start", () => {
		// Wednesday 14 October 2026.
		const wednesday = new Date(2026, 9, 14);
		const expected: Record<PlannerWeekStart, string> = {
			0: "2026-10-11",
			1: "2026-10-12",
			2: "2026-10-13",
			3: "2026-10-14",
			4: "2026-10-08",
			5: "2026-10-09",
			6: "2026-10-10",
		};
		for (const weekStartsOn of PLANNER_WEEK_STARTS) {
			expect(toDayKey(startOfWeek(wednesday, weekStartsOn))).toBe(expected[weekStartsOn]);
		}
	});
});

describe("buildMonthGrid", () => {
	test("is always six weeks of seven days, whatever the month", () => {
		for (let month = 0; month < 24; month += 1) {
			for (const weekStartsOn of PLANNER_WEEK_STARTS) {
				expect(buildMonthGrid(new Date(2026, month, 1), weekStartsOn)).toHaveLength(PLANNER_GRID_DAYS);
			}
		}
		expect(PLANNER_GRID_DAYS).toBe(42);
	});

	test("opens on the configured weekday and contains the whole month, in order", () => {
		for (let month = 0; month < 12; month += 1) {
			for (const weekStartsOn of PLANNER_WEEK_STARTS) {
				const grid = buildMonthGrid(new Date(2026, month, 10), weekStartsOn);
				expect(grid[0]?.date.getDay()).toBe(weekStartsOn);

				const inMonth = grid.filter((cell) => cell.isInMonth);
				const daysInMonth = new Date(2026, month + 1, 0).getDate();
				expect(inMonth).toHaveLength(daysInMonth);
				expect(inMonth[0]?.date.getDate()).toBe(1);
				expect(inMonth.at(-1)?.date.getDate()).toBe(daysInMonth);

				const keys = grid.map((cell) => cell.key);
				expect(new Set(keys).size).toBe(PLANNER_GRID_DAYS);
				expect([...keys].sort()).toEqual(keys);
			}
		}
	});

	test("covers months that start on each of the seven weekdays", () => {
		const weekdays = new Set<number>();
		for (let month = 0; month < 12; month += 1) {
			weekdays.add(new Date(2026, month, 1).getDay());
			const grid = buildMonthGrid(new Date(2026, month, 1), 1);
			const leading = grid.findIndex((cell) => cell.isInMonth);
			expect(leading).toBe((new Date(2026, month, 1).getDay() + 6) % 7);
		}
		expect(weekdays.size).toBe(7);
	});

	test("a month starting on the week's first day still leads with the previous month's last week", () => {
		// February 2026 begins on a Sunday.
		const grid = buildMonthGrid(new Date(2026, 1, 1), 0);
		expect(grid[0]?.key).toBe("2026-02-01");
		expect(grid.at(-1)?.key).toBe("2026-03-14");
	});

	test("draws a leap February with a 29th", () => {
		const keys = buildMonthGrid(new Date(2024, 1, 1), 1)
			.filter((cell) => cell.isInMonth)
			.map((cell) => cell.key);
		expect(keys.at(-1)).toBe("2024-02-29");
		expect(keys).toHaveLength(29);
	});

	test("never repeats or skips a day across Auckland's daylight-saving weeks", () => {
		for (const month of [new Date(2026, 3, 1), new Date(2026, 8, 1)]) {
			const grid = buildMonthGrid(month, 1);
			for (let index = 1; index < grid.length; index += 1) {
				const previous = grid[index - 1];
				const current = grid[index];
				if (!(previous && current)) throw new Error("grid has holes");
				expect(toDayKey(addDays(previous.date, 1))).toBe(current.key);
			}
		}
	});
});

describe("buildWeekRange", () => {
	test("spans the given number of weeks either side of the month's first week", () => {
		const { weeks, initialIndex } = buildWeekRange(new Date(2026, 9, 1), 26, 1);
		expect(weeks).toHaveLength(53);
		expect(initialIndex).toBe(26);
		expect(weeks[initialIndex]?.days.some((day) => day.key === "2026-10-01")).toBe(true);
	});

	test("every week is seven consecutive days from the week start, with no gaps between weeks", () => {
		const { weeks } = buildWeekRange(new Date(2026, 3, 1), 30, 0);
		const keys = weeks.flatMap((week) => week.days.map((day) => day.key));
		for (const week of weeks) {
			expect(week.days).toHaveLength(7);
			expect(week.days[0]?.date.getDay()).toBe(0);
			expect(week.key).toBe(week.days[0]?.key ?? "");
		}
		for (let index = 1; index < keys.length; index += 1) {
			expect(toDayKey(addDays(fromDayKey(keys[index - 1] ?? ""), 1))).toBe(keys[index] ?? "");
		}
	});

	test("labels a week by the month holding most of its days", () => {
		// Monday 28 September – Sunday 4 October 2026: three September days, four October.
		const { weeks } = buildWeekRange(new Date(2026, 9, 1), 0, 1);
		expect(weeks[0]?.days[0]?.key).toBe("2026-09-28");
		expect(toDayKey(weeks[0]?.month ?? new Date(0))).toBe("2026-10-01");
	});

	test("a year of weeks either way is still one entry per week", () => {
		const { weeks } = buildWeekRange(new Date(2026, 0, 1), 52, 1);
		expect(weeks).toHaveLength(105);
	});
});

describe("resolveWeekStart", () => {
	test("a number is taken as given", () => {
		for (const weekStartsOn of PLANNER_WEEK_STARTS) {
			expect(resolveWeekStart("en-US", weekStartsOn)).toBe(weekStartsOn);
		}
	});

	test("auto reads the locale's week, mapping ISO's 7 for Sunday to 0", () => {
		expect(resolveWeekStart("en-US", "auto")).toBe(0);
		expect(resolveWeekStart("en-NZ", "auto")).toBe(1);
		expect(resolveWeekStart("de-DE", "auto")).toBe(1);
		expect(resolveWeekStart("ar-EG", "auto")).toBe(6);
	});

	test("auto falls back to Monday for a locale the runtime cannot read", () => {
		expect(resolveWeekStart("not a locale", "auto")).toBe(1);
		expect([0, 1, 2, 3, 4, 5, 6]).toContain(resolveWeekStart(undefined, "auto"));
	});
});

describe("weekdayLabels", () => {
	test("seven labels in the order the grid draws them", () => {
		const monday = weekdayLabels("en-NZ", 1);
		expect(monday.map((label) => label.short)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
		expect(monday[0]?.long).toBe("Monday");

		const sunday = weekdayLabels("en-NZ", 0);
		expect(sunday.map((label) => label.narrow)).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
	});

	test("starts on the requested weekday for every week start", () => {
		const longs = weekdayLabels("en-NZ", 0).map((label) => label.long);
		for (const weekStartsOn of PLANNER_WEEK_STARTS) {
			expect(weekdayLabels("en-NZ", weekStartsOn)[0]?.long).toBe(longs[weekStartsOn] ?? "");
		}
	});
});

describe("formatMonthTitle", () => {
	test("month and year in the locale's words", () => {
		expect(formatMonthTitle(new Date(2026, 9, 14), "en-NZ")).toBe("October 2026");
		expect(formatMonthTitle(new Date(2026, 9, 14), "de-DE")).toBe("Oktober 2026");
	});
});

describe("msUntilNextMidnight", () => {
	test("counts to the next local midnight", () => {
		expect(msUntilNextMidnight(new Date(2026, 9, 14, 23, 59, 0))).toBe(60_000);
		expect(msUntilNextMidnight(new Date(2026, 9, 14, 0, 0, 0))).toBe(24 * 3_600_000);
	});

	test("follows the clock across daylight-saving nights", () => {
		// The night of 4–5 April 2026 is 25 hours long in Auckland; 26–27 September is 23.
		expect(msUntilNextMidnight(new Date(2026, 3, 5, 0, 0, 0))).toBe(25 * 3_600_000);
		expect(msUntilNextMidnight(new Date(2026, 8, 27, 0, 0, 0))).toBe(23 * 3_600_000);
	});

	test("is always positive, so a timer can never fire in a loop", () => {
		expect(msUntilNextMidnight(new Date(2026, 9, 14, 23, 59, 59, 999))).toBeGreaterThan(0);
	});
});
