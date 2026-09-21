import { describe, expect, test } from "bun:test";
import { timeTicks } from "./time-ticks";

const DAY = 86_400_000;

describe("timeTicks", () => {
	test("lands on local midnight across a week", () => {
		const start = new Date(2026, 0, 1).getTime();
		const ticks = timeTicks([start, start + 7 * DAY], 7);
		expect(ticks.length).toBeGreaterThan(0);
		for (const tick of ticks) {
			const date = new Date(tick);
			expect(date.getHours()).toBe(0);
			expect(date.getMinutes()).toBe(0);
			expect(date.getSeconds()).toBe(0);
		}
	});

	test("lands on the first of the month across a year", () => {
		const start = new Date(2026, 0, 1).getTime();
		const end = new Date(2027, 0, 1).getTime();
		for (const tick of timeTicks([start, end], 12)) {
			expect(new Date(tick).getDate()).toBe(1);
		}
	});

	test("keeps midnight across a DST transition", () => {
		// New Zealand leaves DST on 2026-04-05 and enters it on 2026-09-27. A
		// ladder snapping on epoch multiples would put every tick an hour off
		// midnight on one side of each boundary; d3-time uses calendar
		// arithmetic and does not.
		const previous = process.env.TZ;
		process.env.TZ = "Pacific/Auckland";
		try {
			for (const [year, month, day] of [
				[2026, 2, 30],
				[2026, 8, 21],
			] as const) {
				const start = new Date(year, month, day).getTime();
				const ticks = timeTicks([start, start + 14 * DAY], 14);
				expect(ticks.length).toBeGreaterThan(0);
				for (const tick of ticks) expect(new Date(tick).getHours()).toBe(0);
			}
		} finally {
			process.env.TZ = previous;
		}
	});

	test("stays inside the hour on a sub-day span", () => {
		const start = new Date(2026, 0, 1, 9, 0, 0).getTime();
		const ticks = timeTicks([start, start + 6 * 3_600_000], 6);
		expect(ticks.length).toBeGreaterThan(0);
		for (const tick of ticks) expect(new Date(tick).getMinutes() % 15).toBe(0);
	});

	test("degenerates safely", () => {
		expect(timeTicks([0, DAY], 0)).toEqual([]);
		expect(timeTicks([5, 5], 4)).toEqual([5]);
		expect(timeTicks([Number.NaN, DAY], 4)).toEqual([]);
	});
});
