import { describe, expect, test } from "bun:test";
import { EMPTY_DOMAIN, resolveDomain, resolveDomainPadding } from "./domain";

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

	test("pads by an absolute amount in domain units", () => {
		// Half a step each side is what puts a bar's whole width inside the plot.
		expect(resolveDomain({ values: [0, 4], absolutePadding: 0.5 })).toEqual([-0.5, 4.5]);
	});

	test("applies absolute padding after fractional padding", () => {
		expect(resolveDomain({ values: [0, 100], padding: 0.1, absolutePadding: 5 })).toEqual([-15, 115]);
	});

	test("applies absolute padding to a zero-width domain", () => {
		// One bar still needs a width to stand in.
		expect(resolveDomain({ values: [2, 2], absolutePadding: 0.5 })).toEqual([1.5, 2.5]);
	});

	test("an explicit bound wins over absolute padding", () => {
		expect(resolveDomain({ values: [0, 4], absolutePadding: 0.5, domain: [0, undefined] })).toEqual([0, 4.5]);
	});

	test("ignores a non-finite or negative absolute padding", () => {
		expect(resolveDomain({ values: [0, 4], absolutePadding: Number.NaN })).toEqual([0, 4]);
		expect(resolveDomain({ values: [0, 4], absolutePadding: -1 })).toEqual([0, 4]);
	});
});

describe("resolveDomainPadding", () => {
	test("a bare number pads y only, which is the existing contract", () => {
		expect(resolveDomainPadding(0.1)).toEqual({ x: 0, y: 0.1 });
	});

	test("an object names each axis, defaulting the other to nothing", () => {
		expect(resolveDomainPadding({ x: 0.5 })).toEqual({ x: 0.5, y: 0 });
		expect(resolveDomainPadding({ y: 0.2 })).toEqual({ x: 0, y: 0.2 });
		expect(resolveDomainPadding({ x: 0.5, y: 0.2 })).toEqual({ x: 0.5, y: 0.2 });
	});

	test("undefined and NaN both mean no padding", () => {
		expect(resolveDomainPadding(undefined)).toEqual({ x: 0, y: 0 });
		expect(resolveDomainPadding(Number.NaN)).toEqual({ x: 0, y: 0 });
		expect(resolveDomainPadding({ x: Number.NaN, y: Number.POSITIVE_INFINITY })).toEqual({ x: 0, y: 0 });
	});
});
