import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildLinePath } from "../curve/build-line";
import { RUN_STRIDE, runSegmentCount, toCurvePath } from "./path-segments";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

describe("toCurvePath", () => {
	test("returns nothing for an empty path", () => {
		expect(toCurvePath("")).toEqual([]);
	});

	test("normalises a straight line into a cubic on the same line", () => {
		const path = toCurvePath("M0,0L30,30");
		expect(path).toHaveLength(1);
		// Control points at the third and two-third marks: still a straight line.
		expect(path[0]).toEqual([0, 0, 10, 10, 20, 20, 30, 30]);
	});

	test("keeps a cubic's own control points", () => {
		expect(toCurvePath("M0,0C1,2,3,4,5,6")[0]).toEqual([0, 0, 1, 2, 3, 4, 5, 6]);
	});

	test("gives every segment the same stride whatever the curve was", () => {
		// The reason the solver needs no branch on verb.
		const points = [at(0, 5), at(10, 8), at(20, 3), at(30, 9)];
		for (const curve of ["linear", "monotone", "step", "natural"] as const) {
			for (const run of toCurvePath(buildLinePath(points, { curve }))) {
				expect((run.length - 2) % RUN_STRIDE).toBe(0);
				expect(runSegmentCount(run)).toBeGreaterThan(0);
			}
		}
	});

	test("splits a gapped series into one run per unbroken stretch", () => {
		const path = toCurvePath(buildLinePath([at(0, 1), at(10, 2), at(20, null), at(30, 4), at(40, 5)]));
		expect(path).toHaveLength(2);
		expect(path[0]?.[0]).toBe(0);
		expect(path[1]?.[0]).toBe(30);
	});

	test("drops a single-point subpath, which has no segment to solve", () => {
		expect(toCurvePath("M5,5Z")).toEqual([]);
	});

	test("handles implicit repeated coordinates after one command", () => {
		expect(toCurvePath("M0,0L10,10L20,20")).toHaveLength(1);
		expect(runSegmentCount(toCurvePath("M0,0L10,10L20,20")[0] as number[])).toBe(2);
	});

	test("reads scientific notation and negative numbers", () => {
		const path = toCurvePath("M-1e1,-5L10,5");
		expect(path[0]?.[0]).toBe(-10);
		expect(path[0]?.[1]).toBe(-5);
	});

	test("ignores a verb it does not know rather than throwing", () => {
		expect(() => toCurvePath("M0,0Q5,5,10,10L20,20")).not.toThrow();
	});
});
