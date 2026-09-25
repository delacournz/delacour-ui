import { describe, expect, test } from "bun:test";
import { clampHeight } from "./clamp-height";

describe("clampHeight", () => {
	test("inside the range the height passes through", () => {
		expect(clampHeight(300, 0, 800)).toBe(300);
	});

	test("clamps to the closed height below and the maximum above", () => {
		expect(clampHeight(-40, 0, 800)).toBe(0);
		expect(clampHeight(900, 0, 800)).toBe(800);
	});

	test("a detached closed height is negative and still the floor", () => {
		expect(clampHeight(-100, -50, 750)).toBe(-50);
	});

	test("NaN collapses to the closed height rather than freezing the sheet", () => {
		expect(clampHeight(Number.NaN, 0, 800)).toBe(0);
	});

	test("an inverted range collapses to the closed height", () => {
		expect(clampHeight(300, 0, -1)).toBe(0);
	});
});
