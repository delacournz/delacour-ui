import { describe, expect, test } from "bun:test";
import { APPROXIMATING_CURVES, CURVE_TYPES, CURVES } from "./curves";

describe("CURVES", () => {
	test("every listed name resolves to an interpolator", () => {
		expect(CURVE_TYPES.length).toBeGreaterThan(0);
		for (const name of CURVE_TYPES) expect(CURVES[name]).toBeDefined();
	});

	test("names the curves that do not touch their own data", () => {
		// A scrub dot on an approximating curve sits off every datum. Callers
		// need to be able to ask, rather than find out from a screenshot.
		expect(APPROXIMATING_CURVES).toContain("basis");
		for (const name of APPROXIMATING_CURVES) expect(CURVE_TYPES).toContain(name);
	});

	test("offers monotone, the one interpolating curve that cannot overshoot", () => {
		expect(CURVE_TYPES).toContain("monotone");
	});
});
