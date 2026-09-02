import { describe, expect, test } from "bun:test";
import { sliceOpacity } from "./slice-opacity";

describe("sliceOpacity", () => {
	test("every slice is at full opacity with nothing selected", () => {
		expect(sliceOpacity(0, null, 1, 0.4)).toBe(1);
		expect(sliceOpacity(3, null, 0.8, 0.4)).toBe(0.8);
	});

	test("the selected slice keeps its opacity", () => {
		expect(sliceOpacity(0, 0, 1, 0.4)).toBe(1);
		expect(sliceOpacity(2, 2, 0.5, 0.4)).toBe(0.5);
	});

	test("every other slice dims by the factor", () => {
		expect(sliceOpacity(1, 0, 1, 0.4)).toBeCloseTo(0.4);
		expect(sliceOpacity(0, 1, 0.5, 0.4)).toBeCloseTo(0.2);
	});

	test("a dim of one leaves the others alone", () => {
		expect(sliceOpacity(1, 0, 1, 1)).toBe(1);
	});

	// Index zero is a real slice, not a falsy "nothing selected".
	test("selecting the first slice dims the rest, not the first", () => {
		expect(sliceOpacity(0, 0, 1, 0.4)).toBe(1);
		expect(sliceOpacity(1, 0, 1, 0.4)).toBeCloseTo(0.4);
	});
});
