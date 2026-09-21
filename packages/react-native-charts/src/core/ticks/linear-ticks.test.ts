import { describe, expect, test } from "bun:test";
import { linearTicks, logTicks } from "./linear-ticks";

describe("linearTicks", () => {
	test("returns round numbers, not evenly divided ones", () => {
		expect(linearTicks([0, 97], 5)).toEqual([0, 20, 40, 60, 80]);
	});

	test("treats count as a suggestion and picks the rounder step", () => {
		// Six twenties beats five twenty-fives: d3 optimises for how the numbers
		// read, not for hitting the count. Asserting the count here would be
		// asserting the wrong thing.
		expect(linearTicks([0, 100], 5)).toEqual([0, 20, 40, 60, 80, 100]);
	});

	test("handles a negative domain", () => {
		expect(linearTicks([-50, 50], 5)).toEqual([-40, -20, 0, 20, 40]);
	});

	test("returns the single value for a zero-width domain", () => {
		expect(linearTicks([7, 7], 5)).toEqual([7]);
	});

	test("returns nothing for a non-positive count or a non-finite domain", () => {
		expect(linearTicks([0, 100], 0)).toEqual([]);
		expect(linearTicks([0, 100], -3)).toEqual([]);
		expect(linearTicks([Number.NaN, 100], 5)).toEqual([]);
	});
});

describe("logTicks", () => {
	test("drops to decade powers when d3 would overshoot the count", () => {
		// d3 returns 28 values here — every k·10^i. Unthinned that is a smear.
		expect(logTicks([1, 1000], 10, 4)).toEqual([1, 10, 100, 1000]);
	});

	test("keeps d3's intermediate multiples when they already fit", () => {
		expect(logTicks([1, 1_000_000], 10, 4)).toEqual([1, 100, 10_000, 1_000_000]);
	});

	test("thins the decades themselves when there are more than asked for", () => {
		const ticks = logTicks([1, 1e9], 10, 4);
		expect(ticks).toHaveLength(4);
		expect(ticks[0]).toBe(1);
		expect(ticks.at(-1)).toBe(1e9);
	});

	test("honours a non-decimal base", () => {
		expect(logTicks([1, 1024], 2, 4)).toEqual([1, 8, 128, 1024]);
	});

	test("returns nothing for a domain reaching zero", () => {
		expect(logTicks([0, 100], 10, 5)).toEqual([]);
		expect(logTicks([-1, 100], 10, 5)).toEqual([]);
	});
});
