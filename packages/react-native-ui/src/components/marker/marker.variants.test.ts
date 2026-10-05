import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	MARKER_ICON_TOKEN,
	MARKER_SHIMMER_CYCLE_MS,
	MARKER_SHIMMER_MIN_OPACITY,
	MARKER_VARIANTS,
	markerShimmerOpacity,
	markerVariants,
	resolveMarkerInteractive,
	resolveMarkerShimmer,
} from "./marker.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

describe("markerVariants root slot", () => {
	// Rule 1: a View does not cascade colour to a Text descendant.
	test("carries no text colour or size, at any variant", () => {
		for (const variant of MARKER_VARIANTS) {
			expect(markerVariants({ variant }).root()).not.toMatch(/\btext-/);
		}
	});

	// Text respects OS font scaling; a fixed height would clip it.
	test("carries no fixed height, at any variant", () => {
		for (const variant of MARKER_VARIANTS) {
			expect(markerVariants({ variant }).root()).not.toMatch(/(^|\s)h-/);
		}
	});

	test("is a centred row with vertical rhythm, at every variant", () => {
		for (const variant of MARKER_VARIANTS) {
			const cls = markerVariants({ variant }).root();
			expect(cls).toContain("flex-row");
			expect(cls).toContain("items-center");
			expect(cls).toContain("justify-center");
			expect(cls).toContain("py-2");
		}
	});

	test("only border draws a border and a capsule", () => {
		const border = markerVariants({ variant: "border" }).root();
		expect(border).toMatch(/(^|\s)border(\s|$)/);
		expect(border).toContain("border-border");
		expect(border).toContain("rounded-full");

		for (const variant of ["default", "separator"] as const) {
			const cls = markerVariants({ variant }).root();
			expect(cls).not.toMatch(/(^|\s)border(\s|$)|border-border/);
			expect(cls).not.toContain("rounded-full");
		}
	});

	// A full-width capsule is a pill-shaped box around nothing.
	test("border hugs its content; default and separator span the row", () => {
		expect(markerVariants({ variant: "border" }).root()).toContain("self-center");
		expect(markerVariants({ variant: "border" }).root()).not.toContain("self-stretch");
		expect(markerVariants({ variant: "default" }).root()).toContain("self-stretch");
		expect(markerVariants({ variant: "separator" }).root()).toContain("self-stretch");
	});

	test("dims when disabled", () => {
		expect(markerVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(markerVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("defaults to the default variant", () => {
		expect(markerVariants().root()).toBe(markerVariants({ variant: "default" }).root());
	});
});

describe("markerVariants content slot", () => {
	test("is muted extra-small text at every variant", () => {
		for (const variant of MARKER_VARIANTS) {
			const cls = markerVariants({ variant }).content();
			expect(cls).toContain("text-muted-foreground");
			expect(cls).toContain("text-xs");
		}
	});

	test("separator sets its label in medium weight, not uppercase", () => {
		const cls = markerVariants({ variant: "separator" }).content();
		expect(cls).toContain("font-medium");
		expect(cls).not.toContain("uppercase");
	});
});

describe("markerVariants rule slot", () => {
	// Horizontal inside a row its long axis is width, so self-stretch alone
	// would stretch it vertically and leave it zero wide.
	test("fills the remaining width and centres on the cross axis", () => {
		const cls = markerVariants({ variant: "separator" }).rule();
		expect(cls).toContain("flex-1");
		expect(cls).toContain("self-center");
	});
});

describe("markerVariants icon slot", () => {
	test("sits on the shared icon scale at xs", () => {
		expect(markerVariants().icon()).toContain("size-icon-xs");
	});
});

describe("MARKER_ICON_TOKEN", () => {
	test("is the token the content slot paints text in", () => {
		expect(markerVariants().content()).toContain(`text-${MARKER_ICON_TOKEN}`);
	});

	test("is declared in both themes", () => {
		expect(LIGHT.has(MARKER_ICON_TOKEN)).toBe(true);
		expect(DARK.has(MARKER_ICON_TOKEN)).toBe(true);
	});
});

describe("resolveMarkerInteractive", () => {
	const noop = () => {};

	test("no handler is static", () => {
		expect(resolveMarkerInteractive({})).toBe(false);
	});

	test("onPress alone is interactive", () => {
		expect(resolveMarkerInteractive({ onPress: noop })).toBe(true);
	});

	test("onLongPress alone is interactive", () => {
		expect(resolveMarkerInteractive({ onLongPress: noop })).toBe(true);
	});
});

describe("markerShimmerOpacity", () => {
	test("is opaque at both ends of the cycle, so the wrap has no seam", () => {
		expect(markerShimmerOpacity(0)).toBeCloseTo(1, 10);
		expect(markerShimmerOpacity(1)).toBeCloseTo(1, 10);
		expect(markerShimmerOpacity(1 - 1e-6)).toBeCloseTo(markerShimmerOpacity(0), 5);
	});

	test("dims to its floor half way", () => {
		expect(markerShimmerOpacity(0.5)).toBeCloseTo(MARKER_SHIMMER_MIN_OPACITY, 10);
	});

	test("never leaves the band between the floor and opaque", () => {
		for (let step = 0; step <= 100; step++) {
			const opacity = markerShimmerOpacity(step / 100);
			expect(opacity).toBeGreaterThanOrEqual(MARKER_SHIMMER_MIN_OPACITY - 1e-9);
			expect(opacity).toBeLessThanOrEqual(1 + 1e-9);
		}
	});

	// Text that fades out entirely reads as text that is disappearing.
	test("keeps the floor legible", () => {
		expect(MARKER_SHIMMER_MIN_OPACITY).toBeGreaterThanOrEqual(0.4);
		expect(MARKER_SHIMMER_MIN_OPACITY).toBeLessThan(1);
	});

	test("runs a cycle slow enough to read as a breath, not a blink", () => {
		expect(MARKER_SHIMMER_CYCLE_MS).toBeGreaterThanOrEqual(1200);
		expect(MARKER_SHIMMER_CYCLE_MS).toBeLessThanOrEqual(2400);
	});
});

describe("resolveMarkerShimmer", () => {
	test("runs when asked and motion is allowed", () => {
		expect(resolveMarkerShimmer({ shimmer: true, isCalm: false })).toBe(true);
	});

	test("calm motion stills it", () => {
		expect(resolveMarkerShimmer({ shimmer: true, isCalm: true })).toBe(false);
	});

	test("off stays off", () => {
		expect(resolveMarkerShimmer({ shimmer: false, isCalm: false })).toBe(false);
		expect(resolveMarkerShimmer({ shimmer: undefined, isCalm: false })).toBe(false);
		expect(resolveMarkerShimmer({ shimmer: false, isCalm: true })).toBe(false);
	});
});
