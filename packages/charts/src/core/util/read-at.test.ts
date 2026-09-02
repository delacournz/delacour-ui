import { describe, expect, test } from "bun:test";
import { readAt } from "./read-at";

describe("readAt", () => {
	test("reads a number", () => {
		expect(readAt([1, 2, 3], 1)).toBe(2);
	});

	test("a null, a missing index and the -1 of no datum all read as NaN", () => {
		expect(Number.isNaN(readAt([1, null, 3], 1))).toBe(true);
		expect(Number.isNaN(readAt([1, 2, 3], 7))).toBe(true);
		expect(Number.isNaN(readAt([1, 2, 3], -1))).toBe(true);
	});
});
