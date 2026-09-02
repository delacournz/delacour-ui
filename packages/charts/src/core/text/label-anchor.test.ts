import { describe, expect, test } from "bun:test";
import { anchorX, anchorY } from "./label-anchor";

describe("anchorX", () => {
	test("centres a label on the point it labels", () => {
		expect(anchorX(100, 40, "middle")).toBe(80);
	});

	test("starts and ends against the point", () => {
		expect(anchorX(100, 40, "start")).toBe(100);
		expect(anchorX(100, 40, "end")).toBe(60);
	});
});

describe("anchorY", () => {
	test("drops a label below by a full line plus the gap", () => {
		expect(anchorY(50, 12, "below", 4)).toBe(66);
	});

	test("lifts a label above by the gap alone, the baseline already being on the point", () => {
		expect(anchorY(50, 12, "above", 4)).toBe(46);
	});

	test("centres the glyph box rather than the baseline", () => {
		// Anchoring the baseline puts every y-axis label a third of a line too low.
		expect(anchorY(50, 12, "middle")).toBeGreaterThan(50);
		expect(anchorY(50, 12, "middle")).toBeLessThan(50 + 12 / 2);
	});
});
