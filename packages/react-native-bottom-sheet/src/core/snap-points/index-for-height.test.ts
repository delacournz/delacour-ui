import { describe, expect, test } from "bun:test";
import { heightForIndex, indexForHeight } from "./index-for-height";

const snapPoints = [200, 400, 800];

describe("indexForHeight", () => {
	test("each snap point maps to its own integer index", () => {
		expect(indexForHeight(200, snapPoints, 0)).toBe(0);
		expect(indexForHeight(400, snapPoints, 0)).toBe(1);
		expect(indexForHeight(800, snapPoints, 0)).toBe(2);
	});

	test("the closed height is -1", () => {
		expect(indexForHeight(0, snapPoints, 0)).toBe(-1);
		expect(indexForHeight(-32, snapPoints, -32)).toBe(-1);
	});

	test("between snap points the index is fractional, so the backdrop can follow a drag", () => {
		expect(indexForHeight(100, snapPoints, 0)).toBeCloseTo(-0.5);
		expect(indexForHeight(300, snapPoints, 0)).toBeCloseTo(0.5);
		expect(indexForHeight(600, snapPoints, 0)).toBeCloseTo(1.5);
	});

	test("clamps beyond either end — an over-drag never reports a snap point that does not exist", () => {
		expect(indexForHeight(-100, snapPoints, 0)).toBe(-1);
		expect(indexForHeight(900, snapPoints, 0)).toBe(2);
	});

	test("with no snap points every height is closed", () => {
		expect(indexForHeight(300, [], 0)).toBe(-1);
	});

	test("a snap point coinciding with the closed height does not divide by zero", () => {
		expect(Number.isFinite(indexForHeight(0, [0, 400], 0))).toBe(true);
		expect(indexForHeight(400, [0, 400], 0)).toBe(1);
	});
});

describe("heightForIndex", () => {
	test("round-trips every snap point", () => {
		for (const [index, height] of snapPoints.entries()) {
			expect(heightForIndex(index, snapPoints, 0)).toBe(height);
			expect(indexForHeight(heightForIndex(index, snapPoints, 0), snapPoints, 0)).toBe(index);
		}
	});

	test("-1 is the closed height, resting line included", () => {
		expect(heightForIndex(-1, snapPoints, 0)).toBe(0);
		expect(heightForIndex(-1, snapPoints, -32)).toBe(-32);
	});

	test("clamps an out-of-range index to the nearest end", () => {
		expect(heightForIndex(5, snapPoints, 0)).toBe(800);
		expect(heightForIndex(-3, snapPoints, 0)).toBe(0);
	});

	test("a fractional index interpolates, mirroring indexForHeight", () => {
		expect(heightForIndex(0.5, snapPoints, 0)).toBe(300);
		expect(heightForIndex(-0.5, snapPoints, 0)).toBe(100);
	});

	test("with no snap points every index is closed", () => {
		expect(heightForIndex(0, [], -16)).toBe(-16);
	});
});
