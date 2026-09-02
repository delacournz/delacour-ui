import { describe, expect, test } from "bun:test";
import { resolveXValues } from "./x-values";

describe("resolveXValues", () => {
	test("reads a numeric field as itself", () => {
		const resolved = resolveXValues([{ t: 10 }, { t: 20 }], "t");
		expect(resolved.values).toEqual([10, 20]);
		expect(resolved.isCategorical).toBe(false);
	});

	test("reads a Date field as epoch milliseconds", () => {
		const resolved = resolveXValues([{ t: new Date(1000) }, { t: new Date(2000) }], "t");
		expect(resolved.values).toEqual([1000, 2000]);
		expect(resolved.isCategorical).toBe(false);
	});

	test("substitutes indices for a label field", () => {
		const resolved = resolveXValues([{ m: "Jan" }, { m: "Feb" }, { m: "Mar" }], "m");
		expect(resolved.values).toEqual([0, 1, 2]);
		expect(resolved.isCategorical).toBe(true);
		expect(resolved.raw).toEqual(["Jan", "Feb", "Mar"]);
	});

	test("falls back for the whole series when a single row is unreadable", () => {
		// Mixing measured values with indices breaks the ascending order every
		// binary search here assumes, and a scrub lands on the wrong datum.
		const resolved = resolveXValues([{ t: 10 }, { t: "n/a" }, { t: 30 }], "t");
		expect(resolved.values).toEqual([0, 1, 2]);
		expect(resolved.isCategorical).toBe(true);
	});

	test("handles an empty dataset", () => {
		const resolved = resolveXValues([], "t");
		expect(resolved.values).toEqual([]);
		expect(resolved.isCategorical).toBe(false);
	});
});
