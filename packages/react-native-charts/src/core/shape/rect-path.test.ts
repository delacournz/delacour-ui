import { describe, expect, test } from "bun:test";
import { KAPPA, rectPath } from "./rect-path";

/** The command letters of a path, which is what `isInterpolatable` compares. */
function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

/** Every number in a path, in order. */
function numbers(path: string): number[] {
	return (path.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/g) ?? []).map(Number);
}

describe("rectPath", () => {
	test("is always a move, four cubic corners and three lines, closed", () => {
		// The animation invariant: a bar that rounds its corners when the data
		// changes must keep the same verbs, or Skia snaps instead of morphing.
		expect(commands(rectPath(0, 0, 10, 20, {}))).toBe("MCLCLCLCZ");
		expect(commands(rectPath(0, 0, 10, 20, { topLeft: 4, topRight: 4 }))).toBe("MCLCLCLCZ");
		expect(commands(rectPath(0, 0, 10, 20, { topLeft: 100, bottomRight: 100 }))).toBe("MCLCLCLCZ");
	});

	test("with square corners every point sits on the rect's edge", () => {
		for (const value of numbers(rectPath(2, 3, 12, 23, {}))) {
			expect([2, 3, 12, 23]).toContain(value);
		}
	});

	test("starts on the left edge, one radius below the top", () => {
		expect(rectPath(0, 0, 10, 20, { topLeft: 4 }).startsWith("M0,4")).toBe(true);
		expect(rectPath(0, 0, 10, 20, {}).startsWith("M0,0")).toBe(true);
	});

	test("a rounded corner's cubic reaches the tangent points, not the corner", () => {
		const path = rectPath(0, 0, 10, 20, { topLeft: 4 });
		// M0,4 then C toward (4,0): the cubic's end point is the tangent point.
		expect(path.startsWith(`M0,4C0,${4 - 4 * KAPPA},${4 - 4 * KAPPA},0,4,0`)).toBe(true);
	});

	test("clamps a radius to half the shorter side", () => {
		// A 10×20 rect can round by at most 5; more would fold the path over.
		const path = rectPath(0, 0, 10, 20, { topLeft: 100, topRight: 100 });
		expect(path.startsWith("M0,5")).toBe(true);
		expect(path).toContain("L5,0");
	});

	test("normalises a rect given upside down or back to front", () => {
		expect(rectPath(10, 20, 0, 0, {})).toBe(rectPath(0, 0, 10, 20, {}));
	});

	test("a zero-height rect still has all nine verbs", () => {
		// A gap in a bar series is a zero-height bar at the baseline, so its
		// path must match the bar it may animate into.
		expect(commands(rectPath(0, 5, 10, 5, { topLeft: 4 }))).toBe("MCLCLCLCZ");
	});

	test("treats a negative or unreadable radius as square", () => {
		expect(rectPath(0, 0, 10, 20, { topLeft: -4 })).toBe(rectPath(0, 0, 10, 20, {}));
		expect(rectPath(0, 0, 10, 20, { topLeft: Number.NaN })).toBe(rectPath(0, 0, 10, 20, {}));
	});
});
