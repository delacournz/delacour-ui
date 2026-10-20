import { describe, expect, test } from "bun:test";
import { parseAbsoluteError, renderReport, type VerifyRow, verdict } from "./verify-report";

describe("parseAbsoluteError", () => {
	test("reads ImageMagick's AE count and turns it into a percentage of the frame", () => {
		expect(parseAbsoluteError("1234\n", 100, 100)).toEqual({ pixels: 1234, percent: 12.34 });
	});
	test("prefers the bracketed count ImageMagick 7 prints beside its scaled value", () => {
		expect(parseAbsoluteError("4.54682e+08 (6938)", 532, 720)).toEqual({ pixels: 6938, percent: 1.81 });
		expect(parseAbsoluteError("0 (0)", 10, 10)).toEqual({ pixels: 0, percent: 0 });
	});
	test("is undefined for anything that is not a number", () => {
		expect(parseAbsoluteError("compare: image widths differ", 10, 10)).toBeUndefined();
	});
});

const still = (overrides: Partial<VerifyRow>): VerifyRow => ({
	file: "accordion/variants/light.png",
	kind: "still",
	status: "compared",
	percent: 0.4,
	size: "532x720",
	...overrides,
});

describe("verdict", () => {
	test("passes when every compared still is within the budget", () => {
		expect(verdict([still({}), still({ file: "b.png", percent: 1.9 })], 2, 0)).toEqual({ ok: true, failures: [] });
	});
	test("names a still over the budget, a missing file and a size change", () => {
		const rows = [
			still({ percent: 3.1 }),
			still({ file: "x.png", status: "missing" }),
			still({ file: "y.png", status: "resized", size: "532x720 → 540x720" }),
		];
		const result = verdict(rows, 2, 0);
		expect(result.ok).toBe(false);
		expect(result.failures).toHaveLength(3);
	});
	test("a new file with no baseline is not a failure", () => {
		expect(verdict([still({ status: "new" })], 2, 0).ok).toBe(true);
	});
	test("a failed capture fails the run even with clean diffs", () => {
		expect(verdict([still({})], 2, 1).ok).toBe(false);
	});
});

describe("renderReport", () => {
	test("is a markdown table with one row per file and the verdict", () => {
		const out = renderReport(
			[
				still({}),
				{
					file: "a/b/light.mp4",
					kind: "clip",
					status: "compared",
					durationMs: 3600,
					baselineDurationMs: 7900,
					sheet: ".previews/verify/a-b-light.png",
				},
			],
			{ ok: true, failures: [] }
		);
		expect(out).toContain("| accordion/variants/light.png | still | compared | 532x720 | 0.40% |");
		expect(out).toContain("3.6s (was 7.9s)");
		expect(out).toContain("**PASS**");
	});
});
