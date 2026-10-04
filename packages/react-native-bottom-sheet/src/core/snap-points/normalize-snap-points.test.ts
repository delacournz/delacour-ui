import { describe, expect, test } from "bun:test";
import type { SnapPointSpec } from "../sheet.types";
import { normalizeSnapPoints, parseSnapPoint } from "./normalize-snap-points";

describe("parseSnapPoint", () => {
	test("a finite non-negative number is pixels", () => {
		expect(parseSnapPoint(300)).toEqual({ success: true, data: { kind: "px", value: 300 } });
		expect(parseSnapPoint(0)).toEqual({ success: true, data: { kind: "px", value: 0 } });
	});

	test("a percentage string is a fraction of the available height", () => {
		expect(parseSnapPoint("50%")).toEqual({ success: true, data: { kind: "percent", value: 50 } });
		expect(parseSnapPoint("12.5%")).toEqual({ success: true, data: { kind: "percent", value: 12.5 } });
	});

	test("refuses NaN, infinities and negatives by name", () => {
		for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1] as const) {
			expect(parseSnapPoint(bad)).toEqual({ success: false, error: { code: "invalid-snap-point", value: bad } });
		}
	});

	test("refuses a string that is not a percentage", () => {
		for (const bad of ["50", "abc%", "%", "-10%", "50px"]) {
			expect(parseSnapPoint(bad as SnapPointSpec)).toEqual({
				success: false,
				error: { code: "invalid-snap-point", value: bad },
			});
		}
	});

	test("refuses anything that is not a number or a string", () => {
		expect(parseSnapPoint(undefined as unknown as SnapPointSpec)).toEqual({
			success: false,
			error: { code: "invalid-snap-point", value: undefined },
		});
	});
});

describe("normalizeSnapPoints", () => {
	test("pixels pass through", () => {
		expect(normalizeSnapPoints([200, 400], 800)).toEqual([200, 400]);
	});

	test("percentages resolve against the available height", () => {
		expect(normalizeSnapPoints(["25%", "50%", "100%"], 800)).toEqual([200, 400, 800]);
	});

	test("mixed specs sort ascending regardless of authoring order", () => {
		expect(normalizeSnapPoints(["100%", 100, "50%"], 800)).toEqual([100, 400, 800]);
	});

	test("duplicates collapse, including a pixel and a percentage that agree", () => {
		expect(normalizeSnapPoints([400, "50%", 400], 800)).toEqual([400]);
	});

	test("clamps to the available height and to zero", () => {
		expect(normalizeSnapPoints([1000, "150%"], 800)).toEqual([800]);
	});

	test("skips an invalid spec rather than poisoning the list", () => {
		expect(normalizeSnapPoints([Number.NaN, "x%" as SnapPointSpec, 300], 800)).toEqual([300]);
	});

	test("an unmeasured or zero available height yields nothing to snap to", () => {
		expect(normalizeSnapPoints(["50%"], -1)).toEqual([]);
		expect(normalizeSnapPoints([300], 0)).toEqual([]);
	});

	test("an empty spec is an empty list", () => {
		expect(normalizeSnapPoints([], 800)).toEqual([]);
	});
});
