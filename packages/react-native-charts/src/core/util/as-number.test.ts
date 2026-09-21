import { describe, expect, test } from "bun:test";
import { asNumber, isPlottable } from "./as-number";

describe("asNumber", () => {
	test("passes a number through, including zero and negatives", () => {
		expect(asNumber(0)).toBe(0);
		expect(asNumber(-12.5)).toBe(-12.5);
	});

	test("reads a Date as epoch milliseconds", () => {
		expect(asNumber(new Date(1_700_000_000_000))).toBe(1_700_000_000_000);
	});

	test("parses a numeric string", () => {
		expect(asNumber("42")).toBe(42);
		expect(asNumber(" -3.5 ")).toBe(-3.5);
	});

	test("returns NaN for a label rather than throwing", () => {
		expect(asNumber("January")).toBeNaN();
		expect(asNumber(null)).toBeNaN();
		expect(asNumber(undefined)).toBeNaN();
		expect(asNumber({})).toBeNaN();
		expect(asNumber("")).toBeNaN();
		expect(asNumber("   ")).toBeNaN();
	});

	test("keeps an already-NaN number NaN", () => {
		expect(asNumber(Number.NaN)).toBeNaN();
	});
});

describe("isPlottable", () => {
	test("accepts finite numbers only", () => {
		expect(isPlottable(0)).toBe(true);
		expect(isPlottable(-1)).toBe(true);
	});

	test("rejects the gap marker and every non-finite number", () => {
		expect(isPlottable(null)).toBe(false);
		expect(isPlottable(undefined)).toBe(false);
		expect(isPlottable(Number.NaN)).toBe(false);
		expect(isPlottable(Number.POSITIVE_INFINITY)).toBe(false);
	});
});
