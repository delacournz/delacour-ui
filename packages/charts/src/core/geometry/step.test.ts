import { describe, expect, test } from "bun:test";
import { resolveStep } from "./step";

describe("resolveStep", () => {
	test("is the smallest gap between neighbouring values", () => {
		expect(resolveStep([0, 1, 2, 3])).toBe(1);
		expect(resolveStep([0, 10, 15, 30])).toBe(5);
	});

	test("does not care about input order", () => {
		expect(resolveStep([30, 0, 15, 10])).toBe(5);
	});

	test("ignores duplicates rather than reporting a zero gap", () => {
		// A zero step would give every bar a zero width, and a zero x padding.
		expect(resolveStep([0, 0, 5, 5, 10])).toBe(5);
	});

	test("ignores non-finite values", () => {
		expect(resolveStep([0, Number.NaN, 2, Number.POSITIVE_INFINITY])).toBe(2);
	});

	test("falls back to one with fewer than two distinct values", () => {
		expect(resolveStep([])).toBe(1);
		expect(resolveStep([7])).toBe(1);
		expect(resolveStep([7, 7, 7])).toBe(1);
		expect(resolveStep([Number.NaN])).toBe(1);
	});

	test("never returns zero or NaN", () => {
		expect(resolveStep([1, 1 + Number.EPSILON])).toBeGreaterThan(0);
		expect(Number.isFinite(resolveStep([1e308, -1e308]))).toBe(true);
	});
});
