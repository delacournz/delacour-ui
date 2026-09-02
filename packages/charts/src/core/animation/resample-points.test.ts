import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { matchPointCounts, resamplePoints } from "./resample-points";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

describe("resamplePoints", () => {
	test("keeps both ends and interpolates between", () => {
		const resampled = resamplePoints([at(0, 0), at(10, 10)], 3);
		expect(resampled).toHaveLength(3);
		expect(resampled[0]).toEqual(at(0, 0));
		expect(resampled[1]).toEqual(at(5, 5));
		expect(resampled[2]).toEqual(at(10, 10));
	});

	test("keeps a gap a gap rather than averaging across it", () => {
		expect(resamplePoints([at(0, 0), at(10, null)], 3)[1]?.y).toBeNull();
	});

	test("degenerates safely", () => {
		expect(resamplePoints([], 4)).toEqual([]);
		expect(resamplePoints([at(1, 1)], 3)).toHaveLength(3);
		expect(resamplePoints([at(1, 1), at(2, 2)], 0)).toEqual([]);
		expect(resamplePoints([at(1, 1), at(2, 2)], 1)).toHaveLength(1);
	});
});

describe("matchPointCounts", () => {
	const previous = [at(0, 1), at(10, 2), at(20, 3)];

	test("always returns two arrays of equal length", () => {
		const next = [at(0, 5), at(10, 6), at(20, 7), at(30, 8), at(40, 9)];
		for (const strategy of ["none", "pad-end", "pad-start", "resample"] as const) {
			const [a, b] = matchPointCounts(previous, next, strategy);
			expect(a).toHaveLength(b.length);
		}
	});

	test("passes equal-length series through untouched", () => {
		const next = [at(0, 5), at(10, 6), at(20, 7)];
		const [a, b] = matchPointCounts(previous, next, "none");
		expect(a).toBe(previous);
		expect(b).toBe(next);
	});

	test("grows the tail out of where the line stopped", () => {
		const next = [at(0, 1), at(10, 2), at(20, 3), at(30, 4), at(40, 5)];
		const [a] = matchPointCounts(previous, next, "pad-end");
		expect(a).toHaveLength(5);
		expect(a[3]).toEqual(at(20, 3));
		expect(a[4]).toEqual(at(20, 3));
	});

	test("collapses the departing head into the first survivor", () => {
		const next = [at(20, 3)];
		const [, b] = matchPointCounts(previous, next, "pad-start");
		expect(b).toHaveLength(3);
		expect(b[0]).toEqual(at(20, 3));
		expect(b[2]).toEqual(at(20, 3));
	});

	test("resamples an unrelated series to the longer length", () => {
		const next = [at(100, 9), at(200, 9), at(300, 9), at(400, 9), at(500, 9)];
		const [a, b] = matchPointCounts(previous, next, "resample");
		expect(a).toHaveLength(5);
		expect(b).toHaveLength(5);
	});
});
