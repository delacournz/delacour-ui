import { describe, expect, test } from "bun:test";
import type { PolarLayout } from "./polar.types";
import { resolveSlices } from "./resolve-slices";

const layout: PolarLayout = { center: { x: 100, y: 100 }, radius: 80, innerRadius: 20 };

function sweeps(values: readonly number[], options: { startAngle?: number; circleSweepDegrees?: number } = {}) {
	return resolveSlices({ values, labels: values.map(String), layout, ...options }).map((slice) => slice.sweepAngle);
}

describe("resolveSlices", () => {
	test("splits the circle in proportion, starting at 0°", () => {
		const slices = resolveSlices({ values: [1, 1, 2], labels: ["a", "b", "c"], layout });
		expect(slices.map((slice) => slice.fraction)).toEqual([0.25, 0.25, 0.5]);
		expect(slices.map((slice) => slice.startAngle)).toEqual([0, 90, 180]);
		expect(slices.map((slice) => slice.endAngle)).toEqual([90, 180, 360]);
	});

	test("carries the layout, label, value and index on every slice", () => {
		const [slice] = resolveSlices({ values: [3], labels: ["only"], layout });
		expect(slice).toMatchObject({
			index: 0,
			label: "only",
			value: 3,
			center: layout.center,
			radius: 80,
			innerRadius: 20,
		});
	});

	test("a negative or non-finite value gets a zero sweep but keeps its index", () => {
		const slices = resolveSlices({ values: [1, -1, Number.NaN, 1], labels: ["a", "b", "c", "d"], layout });
		expect(slices.map((slice) => slice.index)).toEqual([0, 1, 2, 3]);
		expect(slices.map((slice) => slice.sweepAngle)).toEqual([180, 0, 0, 180]);
		expect(slices[1]?.startAngle).toBe(180);
		expect(slices[2]?.startAngle).toBe(180);
	});

	test("a zero total gives every slice a zero sweep and no NaN", () => {
		const slices = resolveSlices({ values: [0, 0], labels: ["a", "b"], layout });
		for (const slice of slices) {
			expect(slice.sweepAngle).toBe(0);
			expect(slice.fraction).toBe(0);
			expect(Number.isFinite(slice.startAngle)).toBe(true);
		}
	});

	test("sweeps sum to the circle exactly, with the last slice absorbing drift", () => {
		const values = [1, 1, 1, 1, 1, 1, 1];
		const total = sweeps(values).reduce((sum, sweep) => sum + sweep, 0);
		expect(total).toBe(360);
	});

	test("a trailing zero slice stays zero when drift is absorbed", () => {
		const result = sweeps([1, 1, 1, 0]);
		expect(result[3]).toBe(0);
		expect(result.reduce((sum, sweep) => sum + sweep, 0)).toBe(360);
	});

	test("honours a start angle and a partial circle", () => {
		const slices = resolveSlices({
			values: [1, 1],
			labels: ["a", "b"],
			layout,
			startAngle: -90,
			circleSweepDegrees: 180,
		});
		expect(slices.map((slice) => slice.startAngle)).toEqual([-90, 0]);
		expect(slices.map((slice) => slice.sweepAngle)).toEqual([90, 90]);
	});

	test("flags the one slice that is the whole circle", () => {
		const [whole] = resolveSlices({ values: [5, 0], labels: ["a", "b"], layout });
		expect(whole?.sliceIsEntireCircle).toBe(true);
		const [half] = resolveSlices({ values: [5], labels: ["a"], layout, circleSweepDegrees: 180 });
		expect(half?.sliceIsEntireCircle).toBe(false);
		const [part] = resolveSlices({ values: [5, 5], labels: ["a", "b"], layout });
		expect(part?.sliceIsEntireCircle).toBe(false);
	});

	test("a missing label falls back to the index", () => {
		const [slice] = resolveSlices({ values: [1], labels: [], layout });
		expect(slice?.label).toBe("0");
	});

	test("no values gives no slices", () => {
		expect(resolveSlices({ values: [], labels: [], layout })).toEqual([]);
	});
});
