import { describe, expect, test } from "bun:test";
import { clamp } from "./clamp";

describe("clamp", () => {
	test("holds a value inside the bounds", () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-1, 0, 10)).toBe(0);
		expect(clamp(11, 0, 10)).toBe(10);
	});

	test("returns the bound when the range is a point", () => {
		expect(clamp(5, 3, 3)).toBe(3);
	});

	test("passes the value through when the bounds are inverted", () => {
		// A plot rect measured before layout can produce max < min. Returning the
		// input keeps a finite number flowing; pinning to either bound would put
		// a mark at an edge it was never near.
		expect(clamp(5, 10, 0)).toBe(5);
	});
});
