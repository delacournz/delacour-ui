import { describe, expect, test } from "bun:test";
import { extent, unionExtents } from "./extent";

describe("extent", () => {
	test("finds min and max", () => {
		expect(extent([3, 1, 4, 1, 5])).toEqual([1, 5]);
	});

	test("skips gaps and non-finite values", () => {
		expect(extent([3, null, 1, undefined, Number.NaN, Number.POSITIVE_INFINITY, 5])).toEqual([1, 5]);
	});

	test("returns null for nothing plottable, distinguishing it from all-zero", () => {
		expect(extent([])).toBeNull();
		expect(extent([null, undefined, Number.NaN])).toBeNull();
		expect(extent([0, 0, 0])).toEqual([0, 0]);
	});

	test("collapses a single point to a zero-width extent", () => {
		expect(extent([7])).toEqual([7, 7]);
	});
});

describe("unionExtents", () => {
	test("spans every series", () => {
		expect(unionExtents([[1, 4], [-2, 3], null])).toEqual([-2, 4]);
	});

	test("returns null when every series is empty", () => {
		expect(unionExtents([null, null])).toBeNull();
		expect(unionExtents([])).toBeNull();
	});
});
