import { describe, expect, test } from "bun:test";
import { dashIntervals } from "./dash-intervals";

describe("dashIntervals", () => {
	test("a butt cap draws the lengths as given", () => {
		expect(dashIntervals([6, 4], 2, "butt")).toEqual([6, 4]);
	});

	test("a round or square cap moves one stroke width from each dash into its gap", () => {
		// Each cap reaches half a width past both ends of its dash, so the gap
		// would otherwise shrink by a whole width and a short gap close up.
		expect(dashIntervals([6, 4], 2, "round")).toEqual([4, 6]);
		expect(dashIntervals([6, 4], 2, "square")).toEqual([4, 6]);
	});

	test("a dash shorter than the stroke becomes a dot rather than vanishing", () => {
		const [on, off] = dashIntervals([1, 4], 2, "round");
		expect(on).toBeGreaterThan(0);
		expect(on).toBeLessThan(0.1);
		expect(off).toBe(6);
	});

	test("negative or unreadable lengths are clamped to something Skia accepts", () => {
		const [on, off] = dashIntervals([Number.NaN, -3], 2, "butt");
		expect(on).toBeGreaterThan(0);
		expect(off).toBeGreaterThan(0);
	});
});
