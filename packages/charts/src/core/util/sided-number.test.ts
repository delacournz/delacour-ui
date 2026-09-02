import { describe, expect, test } from "bun:test";
import { sidesOf, valueFromSidedNumber } from "./sided-number";

describe("valueFromSidedNumber", () => {
	test("spreads a bare number to every side", () => {
		expect(valueFromSidedNumber(8, "top")).toBe(8);
		expect(valueFromSidedNumber(8, "left")).toBe(8);
	});

	test("reads one side of an object and defaults the rest to zero", () => {
		expect(valueFromSidedNumber({ left: 40 }, "left")).toBe(40);
		expect(valueFromSidedNumber({ left: 40 }, "right")).toBe(0);
	});

	test("treats undefined and non-finite as zero", () => {
		expect(valueFromSidedNumber(undefined, "top")).toBe(0);
		expect(valueFromSidedNumber(Number.NaN, "top")).toBe(0);
		expect(valueFromSidedNumber({ top: Number.POSITIVE_INFINITY }, "top")).toBe(0);
	});
});

describe("sidesOf", () => {
	test("returns all four", () => {
		expect(sidesOf({ top: 1, right: 2, bottom: 3, left: 4 })).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
		expect(sidesOf(5)).toEqual({ top: 5, right: 5, bottom: 5, left: 5 });
		expect(sidesOf(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
	});
});
