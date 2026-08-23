import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	isSpinnerSize,
	resolveSpinnerColor,
	resolveSpinnerRootClass,
	SPINNER_COLOR_TOKEN,
	SPINNER_COLORS,
	SPINNER_FALLBACK_SIZE_CLASS,
	SPINNER_GLYPH_SIZE_CLASS,
	SPINNER_SIZES,
	spinnerVariants,
} from "./spinner.variants";

/**
 * Position of a class string's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so a test says what it means and
 * survives a token being retuned in `tokens.css`. `tokens.test.ts` is what
 * keeps that array ordered.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("isSpinnerSize", () => {
	test("separates a named size from an edge length", () => {
		for (const size of SPINNER_SIZES) {
			expect(isSpinnerSize(size)).toBe(true);
		}
		expect(isSpinnerSize(40)).toBe(false);
		expect(isSpinnerSize(undefined)).toBe(false);
	});
});

describe("resolveSpinnerRootClass", () => {
	test("centres its content whatever it is given", () => {
		for (const size of [undefined, "sm", 40] as const) {
			expect(resolveSpinnerRootClass({ size })).toContain("items-center");
		}
	});

	test("falls back only when there is nothing to inherit", () => {
		expect(resolveSpinnerRootClass({})).toContain(SPINNER_FALLBACK_SIZE_CLASS);
	});

	test("an inherited class beats the fallback", () => {
		expect(resolveSpinnerRootClass({ inherited: "size-icon-xs" })).toContain("size-icon-xs");
	});

	test("a named size beats an inherited class", () => {
		expect(resolveSpinnerRootClass({ inherited: "size-icon-xs", size: "lg" })).toContain("size-icon-lg");
	});

	test("a className beats a named size", () => {
		expect(resolveSpinnerRootClass({ className: "size-7", size: "sm" })).toContain("size-7");
	});

	test("gives every named size a distinct token, increasing with it", () => {
		const steps = SPINNER_SIZES.map((size) => iconStep(resolveSpinnerRootClass({ size })));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(SPINNER_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// A number is not a class. `size-[40px]` built at runtime is never scanned by
	// Tailwind, so it would compile to nothing — the root takes a numeric size
	// through `style` instead, and the chain steps out of the way entirely rather
	// than leaving a losing class behind to argue with it.
	test("a numeric size emits no size class at all", () => {
		expect(resolveSpinnerRootClass({ size: 40 })).not.toMatch(/\bsize-/);
		expect(resolveSpinnerRootClass({ inherited: "size-icon-sm", size: 40 })).not.toMatch(/\bsize-/);
	});

	test("carries no colour", () => {
		for (const size of SPINNER_SIZES) {
			expect(resolveSpinnerRootClass({ size })).not.toMatch(/\b(text|bg|border)-/);
		}
	});
});

describe("SPINNER_GLYPH_SIZE_CLASS", () => {
	// A composed glyph fills the spinner rather than taking a fixed class, so it
	// still matches at a numeric size the class scale cannot express.
	test("fills the spinner rather than pinning a step", () => {
		expect(SPINNER_GLYPH_SIZE_CLASS).toBe("size-full");
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

describe("spinnerVariants root slot", () => {
	test("centres its content and carries no colour", () => {
		const cls = spinnerVariants().root();
		expect(cls).toContain("items-center");
		expect(cls).toContain("justify-center");
		expect(cls).not.toMatch(/\b(text|bg|border)-/);
	});

	test("takes no size until it is given one", () => {
		expect(spinnerVariants().root()).not.toMatch(/\bsize-/);
	});

	test("gives every named size a distinct token, increasing with it", () => {
		const steps = SPINNER_SIZES.map((size) => iconStep(spinnerVariants({ size }).root()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(SPINNER_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("merges an incoming className last", () => {
		expect(spinnerVariants().root({ className: "opacity-80" })).toContain("opacity-80");
	});
});

describe("spinnerVariants content slot", () => {
	// Load-bearing, not tidiness. The arc is an <Svg> with no width or height,
	// which react-native-svg resolves to '100%'. If this layer were content-sized
	// that percentage would resolve against an indefinite parent and the whole
	// glyph would collapse to zero.
	test("fills the root, so the arc has a definite box to be 100% of", () => {
		expect(spinnerVariants().content()).toContain("size-full");
	});

	test("does not take a size of its own", () => {
		for (const size of SPINNER_SIZES) {
			expect(spinnerVariants({ size }).content()).toBe(spinnerVariants().content());
		}
	});

	test("carries no colour", () => {
		expect(spinnerVariants().content()).not.toMatch(/\b(text|bg|border)-/);
	});
});
