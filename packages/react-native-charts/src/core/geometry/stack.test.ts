import { describe, expect, test } from "bun:test";
import type { ScaleDescriptor } from "../scale/scale.types";
import { collectStackedYValues, stackSeries } from "./stack";

/** Domain 0..10 onto a 100pt tall plot, canvas y growing downward. */
const yScale: ScaleDescriptor = { kind: "linear", domain: [0, 10], range: [100, 0] };
const at = (value: number): number => 100 - value * 10;

const stack = (
	data: readonly Record<string, unknown>[],
	keys: readonly string[],
	scale: ScaleDescriptor = yScale
): ReturnType<typeof stackSeries> =>
	stackSeries({
		data,
		keys,
		xValues: data.map((_, index) => index),
		xPositions: data.map((_, index) => index * 10),
		yScale: scale,
	});

describe("stackSeries", () => {
	test("each series bases where the one before it ended", () => {
		const result = stack(
			[
				{ a: 3, b: 1 },
				{ a: 2, b: 4 },
			],
			["a", "b"]
		);
		expect(result.a?.map((segment) => segment.yValue)).toEqual([3, 2]);
		expect(result.a?.map((segment) => segment.y0Value)).toEqual([0, 0]);
		expect(result.b?.map((segment) => segment.yValue)).toEqual([4, 6]);
		expect(result.b?.map((segment) => segment.y0Value)).toEqual([3, 2]);
	});

	test("scales both edges through the y scale", () => {
		const result = stack([{ a: 3, b: 1 }], ["a", "b"]);
		expect(result.b?.[0]?.y).toBe(at(4));
		expect(result.b?.[0]?.y0).toBe(at(3));
	});

	test("carries x through unchanged", () => {
		const result = stack([{ a: 1 }, { a: 2 }], ["a"]);
		expect(result.a?.map((segment) => segment.x)).toEqual([0, 10]);
		expect(result.a?.map((segment) => segment.xValue)).toEqual([0, 1]);
	});

	test("negatives stack downward from zero, independently of the positives", () => {
		const result = stack([{ a: 3, b: -2, c: -1, d: 1 }], ["a", "b", "c", "d"]);
		expect(result.b?.[0]).toMatchObject({ yValue: -2, y0Value: 0 });
		expect(result.c?.[0]).toMatchObject({ yValue: -3, y0Value: -2 });
		expect(result.d?.[0]).toMatchObject({ yValue: 4, y0Value: 3 });
	});

	test("a null contributes nothing and yields a null segment", () => {
		const result = stack([{ a: 3, b: null, c: 2 }], ["a", "b", "c"]);
		expect(result.b?.[0]).toMatchObject({ y: null, yValue: null, y0: null, y0Value: null });
		// c bases where a ended, as if b were not there.
		expect(result.c?.[0]).toMatchObject({ yValue: 5, y0Value: 3 });
	});

	test("an unreadable value is a null segment too", () => {
		const result = stack([{ a: "nope", b: 2 }], ["a", "b"]);
		expect(result.a?.[0]?.yValue).toBeNull();
		expect(result.b?.[0]).toMatchObject({ yValue: 2, y0Value: 0 });
	});

	test("a zero contributes nothing but is not a gap", () => {
		const result = stack([{ a: 0, b: 2 }], ["a", "b"]);
		expect(result.a?.[0]).toMatchObject({ yValue: 0, y0Value: 0 });
		expect(result.a?.[0]?.y).toBe(at(0));
	});

	test("a log scale puts a base of zero at the floor, never at -Infinity", () => {
		const log: ScaleDescriptor = { kind: "log", domain: [1, 1000], range: [100, 0], base: 10 };
		const result = stack([{ a: 10, b: 100 }], ["a", "b"], log);
		expect(result.a?.[0]?.y0).toBe(100);
		expect(Number.isFinite(result.a?.[0]?.y as number)).toBe(true);
		expect(Number.isFinite(result.b?.[0]?.y0 as number)).toBe(true);
	});

	test("returns an entry for every key, empty data included", () => {
		expect(stack([], ["a", "b"])).toEqual({ a: [], b: [] });
	});
});

describe("collectStackedYValues", () => {
	// A zero pair per row would put zero into the y domain of a chart with no
	// stack at all, which is how a line of prices came to start at nothing.
	test("yields nothing when there are no stack keys", () => {
		expect(collectStackedYValues([{ a: 140 }, { a: 160 }], [])).toEqual([]);
	});

	test("yields each row's positive and negative running totals", () => {
		const values = collectStackedYValues(
			[
				{ a: 3, b: 1 },
				{ a: 2, b: 4 },
				{ a: -2, b: 1 },
			],
			["a", "b"]
		);
		expect(values).toContain(4);
		expect(values).toContain(6);
		expect(values).toContain(-2);
	});

	test("includes zero, so a stack always has a base to stand on", () => {
		expect(collectStackedYValues([{ a: 3 }], ["a"])).toContain(0);
	});

	test("skips nulls and unreadable values", () => {
		expect(collectStackedYValues([{ a: null, b: "x", c: 2 }], ["a", "b", "c"])).toEqual([2, 0]);
	});

	test("is empty for empty data", () => {
		expect(collectStackedYValues([], ["a"])).toEqual([]);
	});
});

describe("stackSeries horizontal", () => {
	test("puts the value edges on x and the category on y, with y0 along the value axis", () => {
		const valueScale: ScaleDescriptor = { kind: "linear", domain: [0, 10], range: [0, 100] };
		const result = stackSeries({
			data: [{ a: 3, b: 1 }],
			keys: ["a", "b"],
			xValues: [0],
			xPositions: [40],
			yScale: valueScale,
			orientation: "horizontal",
		});
		expect(result.a?.[0]).toMatchObject({ x: 30, y: 40, y0: 0, yValue: 3, y0Value: 0 });
		expect(result.b?.[0]).toMatchObject({ x: 40, y: 40, y0: 30, yValue: 4, y0Value: 3 });
	});

	test("a gap keeps its category position and has no x", () => {
		const valueScale: ScaleDescriptor = { kind: "linear", domain: [0, 10], range: [0, 100] };
		const result = stackSeries({
			data: [{ a: null }],
			keys: ["a"],
			xValues: [0],
			xPositions: [40],
			yScale: valueScale,
			orientation: "horizontal",
		});
		expect(result.a?.[0]?.y).toBe(40);
		expect(Number.isNaN(result.a?.[0]?.x)).toBe(true);
		expect(result.a?.[0]?.y0).toBeNull();
	});
});
