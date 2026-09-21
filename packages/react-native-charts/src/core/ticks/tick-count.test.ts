import { describe, expect, test } from "bun:test";
import { downsampleTicks, normalizeTickCount } from "./tick-count";

describe("downsampleTicks", () => {
	test("returns the input untouched when it already fits", () => {
		expect(downsampleTicks([1, 2, 3], 5)).toEqual([1, 2, 3]);
	});

	test("keeps both ends when thinning", () => {
		const thinned = downsampleTicks([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
		expect(thinned).toHaveLength(4);
		expect(thinned[0]).toBe(0);
		expect(thinned.at(-1)).toBe(9);
	});

	test("degenerates safely", () => {
		expect(downsampleTicks([1, 2, 3], 0)).toEqual([]);
		expect(downsampleTicks([1, 2, 3], 1)).toEqual([1]);
		expect(downsampleTicks([], 5)).toEqual([]);
	});

	test("does not alias the input array", () => {
		const source = [1, 2, 3];
		expect(downsampleTicks(source, 5)).not.toBe(source);
	});
});

describe("normalizeTickCount", () => {
	test("spreads exactly count values across the domain", () => {
		expect(normalizeTickCount([0, 100], 5)).toEqual([0, 25, 50, 75, 100]);
	});

	test("puts a secondary axis' gridlines on the primary's", () => {
		// The point of the function: same count, same fractions, same pixels.
		const primary = normalizeTickCount([0, 100], 6);
		const secondary = normalizeTickCount([-3, 12], 6);
		expect(secondary).toHaveLength(primary.length);
		const fractionOf = (values: number[], lo: number, hi: number) => values.map((v) => (v - lo) / (hi - lo));
		expect(fractionOf(secondary, -3, 12)).toEqual(fractionOf(primary, 0, 100));
	});

	test("degenerates safely", () => {
		expect(normalizeTickCount([0, 100], 0)).toEqual([]);
		expect(normalizeTickCount([4, 9], 1)).toEqual([4]);
	});
});
