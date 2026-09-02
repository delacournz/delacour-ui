import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildAreaPath } from "./build-area";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

describe("buildAreaPath", () => {
	test("closes the fill against the baseline", () => {
		expect(buildAreaPath([at(0, 0), at(10, 10)], { baseline: 100 })).toBe("M0,0L10,10L10,100L0,100Z");
	});

	test("returns an empty string for no points", () => {
		expect(buildAreaPath([], { baseline: 100 })).toBe("");
	});

	test("follows a per-point lower edge when given one", () => {
		expect(buildAreaPath([at(0, 0), at(10, 10)], { baseline: 100, lower: [80, 90] })).toBe("M0,0L10,10L10,90L0,80Z");
	});

	test("falls back to the baseline where the lower edge has a gap", () => {
		expect(buildAreaPath([at(0, 0), at(10, 10)], { baseline: 100, lower: [80, null] })).toBe("M0,0L10,10L10,100L0,80Z");
	});

	test("gives the lower edge the same interpolator as the upper", () => {
		// Closing a monotone area by hand leaves a curved top on a straight
		// bottom, and the two disagree visibly wherever the baseline is not flat.
		const path = buildAreaPath([at(0, 0), at(10, 10), at(20, 4)], {
			baseline: 100,
			lower: [90, 70, 95],
			curve: "monotone",
		});
		expect((path.match(/C/g) ?? []).length).toBeGreaterThanOrEqual(4);
	});

	test("breaks at a gap by default", () => {
		const path = buildAreaPath([at(0, 0), at(10, null), at(20, 5)], { baseline: 100 });
		expect((path.match(/M/g) ?? []).length).toBeGreaterThan(1);
	});
});
