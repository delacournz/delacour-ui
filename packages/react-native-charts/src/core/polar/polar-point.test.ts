import { describe, expect, test } from "bun:test";
import { normalizeDegrees, polarToCartesian } from "./polar-point";

const center = { x: 100, y: 100 };

describe("polarToCartesian", () => {
	test("0° is straight up", () => {
		const point = polarToCartesian(center, 50, 0);
		expect(point.x).toBeCloseTo(100);
		expect(point.y).toBeCloseTo(50);
	});

	test("90° is to the right, so angles run clockwise", () => {
		const point = polarToCartesian(center, 50, 90);
		expect(point.x).toBeCloseTo(150);
		expect(point.y).toBeCloseTo(100);
	});

	test("180° is straight down and 270° is to the left", () => {
		expect(polarToCartesian(center, 50, 180).y).toBeCloseTo(150);
		expect(polarToCartesian(center, 50, 270).x).toBeCloseTo(50);
	});

	test("a full turn lands where it started", () => {
		const start = polarToCartesian(center, 50, 30);
		const end = polarToCartesian(center, 50, 390);
		expect(end.x).toBeCloseTo(start.x);
		expect(end.y).toBeCloseTo(start.y);
	});

	test("radius zero is the centre at any angle", () => {
		expect(polarToCartesian(center, 0, 123)).toEqual(center);
	});
});

describe("normalizeDegrees", () => {
	test("keeps a value already in range", () => {
		expect(normalizeDegrees(45)).toBe(45);
	});

	test("wraps past a full turn, in both directions", () => {
		expect(normalizeDegrees(370)).toBe(10);
		expect(normalizeDegrees(-10)).toBe(350);
		expect(normalizeDegrees(720)).toBe(0);
	});

	test("never returns 360", () => {
		expect(normalizeDegrees(360)).toBe(0);
	});

	test("turns a non-finite angle into 0 rather than NaN", () => {
		expect(normalizeDegrees(Number.NaN)).toBe(0);
		expect(normalizeDegrees(Number.POSITIVE_INFINITY)).toBe(0);
	});
});
