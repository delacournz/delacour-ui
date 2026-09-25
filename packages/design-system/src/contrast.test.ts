import { describe, expect, test } from "bun:test";
import { contrastRatio, oklchToSrgb, parseOklch, relativeLuminance } from "./contrast";
import { HOUSE_CONFIG } from "./house";
import { resolveTokens } from "./resolve";

describe("parseOklch", () => {
	test("reads the three channels the ramps are written in", () => {
		expect(parseOklch("oklch(0.666 0.157 58.318)")).toEqual({ l: 0.666, c: 0.157, h: 58.318 });
	});

	test("rejects anything that is not an oklch() literal", () => {
		expect(parseOklch("#fbbf24")).toBeUndefined();
		expect(parseOklch("oklch(0.5 0.1)")).toBeUndefined();
	});
});

describe("oklchToSrgb", () => {
	test("maps the achromatic ends onto black and white", () => {
		expect(oklchToSrgb({ l: 0, c: 0, h: 0 })).toEqual({ r: 0, g: 0, b: 0 });
		expect(oklchToSrgb({ l: 1, c: 0, h: 0 })).toEqual({ r: 255, g: 255, b: 255 });
	});

	test("round-trips the brand amber to its hex", () => {
		const amber = oklchToSrgb({ l: 0.837, c: 0.164, h: 84.429 });
		expect(amber.r).toBe(251);
		expect(amber.g).toBe(191);
		expect(Math.abs(amber.b - 36)).toBeLessThanOrEqual(1);
	});
});

describe("relativeLuminance", () => {
	test("is 0 for black and 1 for white", () => {
		expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
		expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
	});
});

describe("contrastRatio", () => {
	test("is 21:1 between black and white, either way round", () => {
		expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 1);
		expect(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)")).toBeCloseTo(21, 1);
	});

	test("is 1:1 for a colour against itself", () => {
		expect(contrastRatio("oklch(0.5 0.1 60)", "oklch(0.5 0.1 60)")).toBeCloseTo(1, 5);
	});

	test("throws on a value it cannot parse", () => {
		expect(() => contrastRatio("#fff", "oklch(0 0 0)")).toThrow();
	});
});

/**
 * The house theme's first chart colour has to read on a light surface.
 *
 * `chart-1` is what a single-series sparkline, line or bar is drawn in, and
 * the delacour ramp's palest amber sat at 1.4:1 against the light page — a
 * highlight, not a series. WCAG's non-text minimum is 3:1, against both the
 * page and the card it is usually drawn over.
 */
describe("the house chart ramp in light mode", () => {
	const { light } = resolveTokens(HOUSE_CONFIG);
	const token = (key: string): string => {
		const value = light[key];
		if (typeof value !== "string") throw new Error(`${key} is not a colour`);
		return value;
	};

	test("chart-1 clears 3:1 against the page and the card", () => {
		expect(contrastRatio(token("chart-1"), token("background"))).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(token("chart-1"), token("card"))).toBeGreaterThanOrEqual(3);
	});

	test("the ramp still darkens step by step", () => {
		const lightness = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"].map((key) => {
			const parsed = parseOklch(token(key));
			if (!parsed) throw new Error(`${key} is not oklch`);
			return parsed.l;
		});

		for (let i = 1; i < lightness.length; i++) {
			expect(lightness[i]).toBeLessThan(lightness[i - 1] as number);
		}
	});
});
