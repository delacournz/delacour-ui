import { describe, expect, test } from "bun:test";
import { getChartBounds, hasArea, NO_GUTTERS } from "./chart-bounds";

const size = { width: 300, height: 200 };

describe("getChartBounds", () => {
	test("is the whole canvas with no padding or gutters", () => {
		expect(getChartBounds(size, undefined, NO_GUTTERS)).toEqual({ left: 0, top: 0, right: 300, bottom: 200 });
	});

	test("subtracts padding and gutters from the right sides", () => {
		const bounds = getChartBounds(size, { left: 10, bottom: 5 }, { top: 0, right: 4, bottom: 20, left: 30 });
		expect(bounds).toEqual({ left: 40, top: 0, right: 296, bottom: 175 });
	});

	test("collapses rather than inverting when the gutters exceed the canvas", () => {
		// Real on the first frame, before onLayout reports a size. An inverted
		// rect gives a negative scale range and draws every mark mirrored.
		const bounds = getChartBounds({ width: 20, height: 20 }, undefined, { top: 0, right: 0, bottom: 40, left: 40 });
		expect(bounds.right).toBeGreaterThanOrEqual(bounds.left);
		expect(bounds.bottom).toBeGreaterThanOrEqual(bounds.top);
		expect(hasArea(bounds)).toBe(false);
	});

	test("treats a non-finite canvas as zero", () => {
		const bounds = getChartBounds({ width: Number.NaN, height: 200 }, undefined, NO_GUTTERS);
		expect(Number.isFinite(bounds.right)).toBe(true);
	});
});

describe("hasArea", () => {
	test("is false for a rect with no room to draw in", () => {
		expect(hasArea({ left: 0, top: 0, right: 0, bottom: 10 })).toBe(false);
		expect(hasArea({ left: 0, top: 0, right: 10, bottom: 10 })).toBe(true);
	});
});
