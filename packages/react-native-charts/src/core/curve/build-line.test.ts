import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildLinePath, isDrawable } from "./build-line";
import { CURVE_TYPES } from "./curves";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

/** The command letters of a path, which is what `isInterpolatable` compares. */
function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

describe("buildLinePath", () => {
	test("returns an empty string for no points", () => {
		expect(buildLinePath([])).toBe("");
	});

	test("emits a move then lines for a linear curve", () => {
		expect(buildLinePath([at(0, 0), at(10, 10)])).toBe("M0,0L10,10");
	});

	test("emits cubics for monotone", () => {
		expect(commands(buildLinePath([at(0, 0), at(10, 10), at(20, 5)], { curve: "monotone" }))).toBe("MCC");
	});

	test("breaks the line at a gap rather than drawing through it", () => {
		// Two subpaths, two moves. A line drawn across missing data asserts a
		// trend nobody measured.
		expect(commands(buildLinePath([at(0, 0), at(10, null), at(20, 5)]))).toContain("MZM");
	});

	test("draws through a gap when asked", () => {
		expect(buildLinePath([at(0, 0), at(10, null), at(20, 5)], { connectMissingData: true })).toBe("M0,0L20,5");
	});

	test("treats a non-finite coordinate as a gap", () => {
		expect(buildLinePath([at(0, 0), at(10, Number.NaN), at(20, 5)], { connectMissingData: true })).toBe("M0,0L20,5");
	});

	test("returns an empty string when every point is a gap", () => {
		expect(buildLinePath([at(0, null), at(10, null)], { connectMissingData: true })).toBe("");
	});

	test("produces the same command sequence for equal point counts on every curve", () => {
		// This is the animation invariant. Skia can only interpolate two paths
		// whose verbs match, so a data change that keeps the point count must
		// keep the command sequence — otherwise `useAnimatedPath` snaps instead
		// of morphing and the chart jumps.
		const before = [at(0, 5), at(10, 8), at(20, 3), at(30, 9)];
		const after = [at(0, 2), at(10, 1), at(20, 7), at(30, 4)];
		for (const curve of CURVE_TYPES) {
			expect(commands(buildLinePath(after, { curve }))).toBe(commands(buildLinePath(before, { curve })));
		}
	});
});

describe("isDrawable", () => {
	test("rejects gaps and non-finite coordinates", () => {
		expect(isDrawable(at(0, 1))).toBe(true);
		expect(isDrawable(at(0, null))).toBe(false);
		expect(isDrawable(at(0, Number.NaN))).toBe(false);
		expect(isDrawable(at(Number.POSITIVE_INFINITY, 1))).toBe(false);
	});
});
