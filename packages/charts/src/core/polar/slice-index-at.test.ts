import { describe, expect, test } from "bun:test";
import { sliceIndexAt } from "./slice-index-at";

// Three quarters and a zero-sweep slice: 0–90, 90–180, 180–180, 180–360.
const starts = [0, 90, 180, 180];
const sweeps = [90, 90, 0, 180];

function hit(x: number, y: number, innerRadius = 0): number {
	return sliceIndexAt(x, y, 100, 100, innerRadius, 80, starts, sweeps);
}

describe("sliceIndexAt", () => {
	test("finds the slice under a point", () => {
		expect(hit(130, 70)).toBe(0);
		expect(hit(130, 130)).toBe(1);
		expect(hit(70, 130)).toBe(3);
		expect(hit(70, 70)).toBe(3);
	});

	test("outside the radius is nothing", () => {
		expect(hit(200, 100)).toBe(-1);
	});

	test("inside the hole is nothing", () => {
		expect(hit(110, 100, 40)).toBe(-1);
		expect(hit(150, 100, 40)).toBe(1);
	});

	test("a zero-sweep slice is never hit", () => {
		expect(hit(100, 150)).toBe(3);
	});

	test("wraps a slice that crosses 360°", () => {
		// One slice from 300° through 0° to 60°.
		expect(sliceIndexAt(100, 50, 100, 100, 0, 80, [300], [120])).toBe(0);
		expect(sliceIndexAt(150, 100, 100, 100, 0, 80, [300], [120])).toBe(-1);
	});

	test("accepts start angles outside [0, 360)", () => {
		expect(sliceIndexAt(130, 70, 100, 100, 0, 80, [-360], [90])).toBe(0);
		expect(sliceIndexAt(130, 70, 100, 100, 0, 80, [720], [90])).toBe(0);
	});

	test("a full-circle slice takes every point", () => {
		expect(sliceIndexAt(100, 50, 100, 100, 0, 80, [0], [360])).toBe(0);
		expect(sliceIndexAt(60, 140, 100, 100, 0, 80, [0], [360])).toBe(0);
	});

	test("no slices is nothing", () => {
		expect(sliceIndexAt(100, 100, 100, 100, 0, 80, [], [])).toBe(-1);
	});
});
