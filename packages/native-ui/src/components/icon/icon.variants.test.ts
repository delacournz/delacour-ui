import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	ICON_FALLBACK_COLOR,
	ICON_FALLBACK_SIZE_CLASS,
	ICON_SIZES,
	iconVariants,
	isIconSize,
	resolveIconSizeClass,
} from "./icon.variants";

/**
 * Position of a class string's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points so a test says what it means — that
 * one icon is a step larger than another — and does not have to be edited when
 * a token's value is retuned in `tokens.css`. `tokens.test.ts` is what keeps
 * this array ordered.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("iconVariants", () => {
	test("gives every named size a distinct token, increasing with it", () => {
		const steps = ICON_SIZES.map((size) => iconStep(iconVariants({ size })));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(ICON_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// The whole point of the shared scale: a named size has to name a token, not
	// a raw utility, or Spinner cannot line up with it.
	test("names a token from the shared icon scale at every size", () => {
		for (const size of ICON_SIZES) {
			expect(iconVariants({ size })).toBe(`size-icon-${size}`);
		}
	});

	// An icon takes a colour value rather than a class, so the size axis must not
	// smuggle one in. See ICON_FALLBACK_COLOR and useThemeColor.
	test("carries size only, never colour", () => {
		for (const size of ICON_SIZES) {
			expect(iconVariants({ size })).toMatch(/\bsize-/);
			expect(iconVariants({ size })).not.toMatch(/\b(text|bg|border)-/);
		}
	});

	// A default would emit from inside this call, ahead of an inherited class in
	// the merge, and the fallback would then beat the enclosing component.
	test("emits nothing without a size, so the fallback can lose to context", () => {
		expect(iconVariants() ?? "").not.toMatch(/\bsize-/);
	});
});

describe("isIconSize", () => {
	test("separates a named size from an edge length", () => {
		for (const size of ICON_SIZES) {
			expect(isIconSize(size)).toBe(true);
		}
		expect(isIconSize(18)).toBe(false);
		expect(isIconSize(undefined)).toBe(false);
	});
});

describe("resolveIconSizeClass", () => {
	test("falls back when there is nothing to go on", () => {
		expect(resolveIconSizeClass({})).toBe(ICON_FALLBACK_SIZE_CLASS);
	});

	test("an inherited class beats the fallback", () => {
		expect(resolveIconSizeClass({ inherited: "size-icon-xs" })).toBe("size-icon-xs");
	});

	test("a named size beats an inherited class", () => {
		expect(resolveIconSizeClass({ inherited: "size-icon-xs", size: "xl" })).toBe("size-icon-xl");
	});

	test("a className beats a named size", () => {
		expect(resolveIconSizeClass({ className: "size-7", size: "xs" })).toBe("size-7");
	});

	test("a className beats an inherited class", () => {
		expect(resolveIconSizeClass({ className: "size-7", inherited: "size-icon-sm" })).toBe("size-7");
	});

	test("resolves to exactly one size utility, whatever it was given", () => {
		const cls = resolveIconSizeClass({ className: "size-7", inherited: "size-icon-xl", size: "xs" });
		expect(cls.split(" ").filter((name) => name.startsWith("size-"))).toHaveLength(1);
	});

	// A numeric size is not a class — it goes straight to the glyph's prop, and
	// uniwind then skips its mapping because that prop is already defined. The
	// chain is still built and still passed; nothing reads it.
	test("a numeric size leaves the chain untouched", () => {
		expect(resolveIconSizeClass({ size: 18 })).toBe(ICON_FALLBACK_SIZE_CLASS);
		expect(resolveIconSizeClass({ inherited: "size-icon-sm", size: 18 })).toBe("size-icon-sm");
	});

	test("carries through a className that is not a size", () => {
		expect(resolveIconSizeClass({ className: "opacity-50" })).toContain("opacity-50");
		expect(resolveIconSizeClass({ className: "opacity-50" })).toContain(ICON_FALLBACK_SIZE_CLASS);
	});
});

describe("ICON_FALLBACK_COLOR", () => {
	test("names a token the theme always defines", () => {
		expect(ICON_FALLBACK_COLOR).toBe("foreground");
	});
});
