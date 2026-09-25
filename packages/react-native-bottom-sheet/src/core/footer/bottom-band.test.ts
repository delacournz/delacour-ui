import { describe, expect, test } from "bun:test";
import { bandNow, bottomBand, footerHeight } from "./bottom-band";

describe("bottomBand", () => {
	test("an attached sheet reserves the safe-area inset", () => {
		expect(bottomBand(false, 34)).toBe(34);
	});

	test("a detached sheet floats above the inset, so it has no band", () => {
		expect(bottomBand(true, 34)).toBe(0);
	});

	test("a negative inset is treated as none", () => {
		expect(bottomBand(false, -1)).toBe(0);
	});
});

describe("bandNow", () => {
	test("the band is whole with the keyboard down and gone with it up", () => {
		expect(bandNow(34, 0)).toBe(34);
		expect(bandNow(34, 1)).toBe(0);
	});

	test("collapses linearly with progress", () => {
		expect(bandNow(34, 0.5)).toBe(17);
	});

	test("clamps a progress outside [0, 1]", () => {
		expect(bandNow(34, -0.2)).toBe(34);
		expect(bandNow(34, 1.3)).toBe(0);
	});
});

describe("footerHeight", () => {
	test("a footer is its content plus the band under it right now", () => {
		expect(footerHeight(true, 56, 34)).toBe(90);
	});

	test("no footer, no height, whatever was measured", () => {
		expect(footerHeight(false, 56, 34)).toBe(0);
	});

	test("an unmeasured footer contributes only its band", () => {
		expect(footerHeight(true, -1, 34)).toBe(34);
	});
});
