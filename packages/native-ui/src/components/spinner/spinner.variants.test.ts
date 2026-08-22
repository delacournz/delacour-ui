import { describe, expect, test } from "bun:test";
import {
	resolveSpinnerColor,
	resolveSpinnerSize,
	SPINNER_COLOR_TOKEN,
	SPINNER_COLORS,
	SPINNER_FALLBACK_SIZE,
	SPINNER_SIZE,
	SPINNER_SIZES,
	spinnerVariants,
} from "./spinner.variants";

describe("resolveSpinnerSize", () => {
	test("maps each named size to its point value", () => {
		for (const size of SPINNER_SIZES) {
			expect(resolveSpinnerSize(size)).toBe(SPINNER_SIZE[size]);
		}
	});

	test("gives every named size a distinct value, increasing with it", () => {
		const values = SPINNER_SIZES.map((size) => SPINNER_SIZE[size]);
		expect(new Set(values).size).toBe(SPINNER_SIZES.length);
		expect([...values]).toEqual([...values].sort((a, b) => a - b));
	});

	test("passes an explicit number through", () => {
		expect(resolveSpinnerSize(18)).toBe(18);
		expect(resolveSpinnerSize(18, 32)).toBe(18);
	});

	test("takes the inherited size when none is given", () => {
		expect(resolveSpinnerSize(undefined, 18)).toBe(18);
	});

	test("falls back only when there is nothing to inherit", () => {
		expect(resolveSpinnerSize(undefined)).toBe(SPINNER_FALLBACK_SIZE);
		expect(resolveSpinnerSize(undefined, undefined)).toBe(SPINNER_FALLBACK_SIZE);
	});

	test("an explicit size beats the inherited one", () => {
		expect(resolveSpinnerSize("sm", 32)).toBe(SPINNER_SIZE.sm);
	});
});

describe("resolveSpinnerColor", () => {
	test("maps each named colour to its token", () => {
		for (const color of SPINNER_COLORS) {
			expect(resolveSpinnerColor(color)).toBe(SPINNER_COLOR_TOKEN[color]);
		}
	});

	test("gives every named colour a distinct token", () => {
		const tokens = SPINNER_COLORS.map((color) => SPINNER_COLOR_TOKEN[color]);
		expect(new Set(tokens).size).toBe(SPINNER_COLORS.length);
	});

	test("passes a literal colour through untouched", () => {
		expect(resolveSpinnerColor("#EC4899")).toBe("#EC4899");
		expect(resolveSpinnerColor("rgb(236, 72, 153)")).toBe("rgb(236, 72, 153)");
	});

	test("passes an unnamed theme token through untouched", () => {
		expect(resolveSpinnerColor("emerald-500")).toBe("emerald-500");
		expect(resolveSpinnerColor("primary-foreground")).toBe("primary-foreground");
	});

	test("takes the inherited token when none is given", () => {
		expect(resolveSpinnerColor(undefined, "primary-foreground")).toBe("primary-foreground");
	});

	test("maps an inherited value that happens to be a named colour", () => {
		expect(resolveSpinnerColor(undefined, "danger")).toBe(SPINNER_COLOR_TOKEN.danger);
	});

	test("falls back only when there is nothing to inherit", () => {
		expect(resolveSpinnerColor(undefined)).toBe(SPINNER_COLOR_TOKEN.default);
	});

	test("an explicit colour beats the inherited one", () => {
		expect(resolveSpinnerColor("#EC4899", "primary-foreground")).toBe("#EC4899");
		expect(resolveSpinnerColor("danger", "primary-foreground")).toBe(SPINNER_COLOR_TOKEN.danger);
	});
});

describe("spinnerVariants", () => {
	test("centres its content and carries no colour", () => {
		const cls = spinnerVariants();
		expect(cls).toContain("items-center");
		expect(cls).toContain("justify-center");
		expect(cls).not.toMatch(/\b(text|bg|border)-/);
	});

	test("merges an incoming className last", () => {
		expect(spinnerVariants({ className: "opacity-80" })).toContain("opacity-80");
	});
});
