import { describe, expect, test } from "bun:test";
import { EMPTY_DOMAIN, resolveDomain } from "./domain";

describe("resolveDomain", () => {
	test("measures the extent of the data", () => {
		expect(resolveDomain({ values: [3, 1, 4, 1, 5] })).toEqual([1, 5]);
	});

	test("falls back to a usable domain when nothing is measurable", () => {
		expect(resolveDomain({ values: [] })).toEqual(EMPTY_DOMAIN);
		expect(resolveDomain({ values: [null, Number.NaN] })).toEqual(EMPTY_DOMAIN);
	});

	test("leaves a constant series zero-width so it draws flat through the middle", () => {
		// Expanding here would invent a spread the data does not have.
		expect(resolveDomain({ values: [50, 50, 50] })).toEqual([50, 50]);
	});

	test("pulls zero in only when asked", () => {
		expect(resolveDomain({ values: [40, 90] })).toEqual([40, 90]);
		expect(resolveDomain({ values: [40, 90], includeZero: true })).toEqual([0, 90]);
		expect(resolveDomain({ values: [-40, -10], includeZero: true })).toEqual([-40, 0]);
	});

	test("pads by a fraction of the extent", () => {
		expect(resolveDomain({ values: [0, 100], padding: 0.1 })).toEqual([-10, 110]);
	});

	test("pads a constant series against its own magnitude", () => {
		expect(resolveDomain({ values: [50, 50], padding: 0.1 })).toEqual([45, 55]);
	});

	test("lets an explicit bound override either end independently", () => {
		expect(resolveDomain({ values: [3, 77], domain: [0, undefined] })).toEqual([0, 77]);
		expect(resolveDomain({ values: [3, 77], domain: [undefined, 100] })).toEqual([3, 100]);
		expect(resolveDomain({ values: [3, 77], domain: [0, 100] })).toEqual([0, 100]);
	});

	test("an explicit bound wins over padding", () => {
		expect(resolveDomain({ values: [0, 100], padding: 0.5, domain: [0, undefined] })[0]).toBe(0);
	});

	test("ignores a non-finite explicit bound rather than poisoning the scale", () => {
		expect(resolveDomain({ values: [3, 77], domain: [Number.NaN, undefined] })).toEqual([3, 77]);
	});
});
