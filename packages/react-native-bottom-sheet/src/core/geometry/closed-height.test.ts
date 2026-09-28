import { describe, expect, test } from "bun:test";
import { availableHeight, closedHeight, restingBottom } from "./closed-height";

describe("restingBottom", () => {
	test("an attached sheet rests on the container's bottom edge", () => {
		expect(restingBottom(false, 16, 34)).toBe(0);
	});

	test("a detached sheet rests its offset above the safe-area inset", () => {
		expect(restingBottom(true, 16, 34)).toBe(50);
	});

	test("an unmeasured inset counts as zero", () => {
		expect(restingBottom(true, 16, -1)).toBe(16);
	});
});

describe("closedHeight", () => {
	test("an attached sheet closes at zero", () => {
		expect(closedHeight(0)).toBe(0);
	});

	test("a detached sheet closes below its resting line, so its top clears the container edge", () => {
		expect(closedHeight(50)).toBe(-50);
	});
});

describe("availableHeight", () => {
	test("the container less the resting bottom", () => {
		expect(availableHeight(800, 0)).toBe(800);
		expect(availableHeight(800, 50)).toBe(750);
	});

	test("an unmeasured container has nothing available", () => {
		expect(availableHeight(-1, 0)).toBe(0);
	});
});
