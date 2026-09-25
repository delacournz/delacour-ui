import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	resolveSurfacePlane,
	resolveSurfaceVariant,
	SURFACE_FILLED_VARIANTS,
	SURFACE_FOREGROUND_TOKENS,
	SURFACE_PADDINGS,
	SURFACE_VARIANTS,
	surfaceVariants,
} from "./surface.variants";

/** Every class string the variant function can produce, one per combination. */
function everyRoot(): string[] {
	return SURFACE_VARIANTS.flatMap((variant) =>
		SURFACE_PADDINGS.map((padding) => surfaceVariants({ padding, variant }).root())
	);
}

describe("surfaceVariants root slot", () => {
	test("defaults to the card surface with md padding", () => {
		const cls = surfaceVariants().root();
		expect(cls).toContain("bg-card");
		expect(cls).toContain("border-border");
		expect(cls).toContain("p-4");
	});

	test("maps each variant to its fill", () => {
		expect(surfaceVariants({ variant: "default" }).root()).toContain("bg-card");
		expect(surfaceVariants({ variant: "secondary" }).root()).toContain("bg-secondary");
		expect(surfaceVariants({ variant: "tertiary" }).root()).toContain("bg-tertiary");
		expect(surfaceVariants({ variant: "transparent" }).root()).toContain("bg-transparent");
	});

	test("gives every variant a distinct surface", () => {
		const seen = new Set(SURFACE_VARIANTS.map((variant) => surfaceVariants({ variant }).root()));
		expect(seen.size).toBe(SURFACE_VARIANTS.length);
	});

	// A card on a page is white on near-white in light. The hairline is what
	// holds its edge; the filled rungs below it are separated by their fill.
	test("only the default variant draws a visible border", () => {
		expect(surfaceVariants({ variant: "default" }).root()).toContain("border-border");
		for (const variant of SURFACE_VARIANTS.filter((name) => name !== "default")) {
			expect(surfaceVariants({ variant }).root()).not.toContain("border-border");
		}
	});

	// Every variant carries the same one-point border box, so switching variant
	// never moves the content by a pixel.
	test("every variant reserves the same border width", () => {
		for (const cls of everyRoot()) {
			expect(cls).toMatch(/(^|\s)border(\s|$)/);
		}
	});

	test("is card-shaped, with a continuous corner, at every variant and padding", () => {
		for (const cls of everyRoot()) {
			expect(cls).toContain("rounded-lg");
			expect(cls).toContain("border-continuous");
		}
	});

	test("maps each padding to its step", () => {
		expect(surfaceVariants({ padding: "none" }).root()).toContain("p-0");
		expect(surfaceVariants({ padding: "sm" }).root()).toContain("p-3");
		expect(surfaceVariants({ padding: "md" }).root()).toContain("p-4");
		expect(surfaceVariants({ padding: "lg" }).root()).toContain("p-6");
	});

	// `none` is for content that bleeds to the edge — an image, a chart — and
	// that content has to take the corner with it.
	test("clips only when its content touches the edge", () => {
		expect(surfaceVariants({ padding: "none" }).root()).toContain("overflow-hidden");
		for (const padding of SURFACE_PADDINGS.filter((name) => name !== "none")) {
			expect(surfaceVariants({ padding }).root()).not.toContain("overflow-hidden");
		}
	});

	// Rule 1: a React Native View does not cascade colour to a Text descendant.
	test("carries no text treatment on the root", () => {
		for (const cls of everyRoot()) {
			expect(cls).not.toMatch(/\btext-/);
		}
	});

	test("draws no shadow anywhere", () => {
		for (const cls of everyRoot()) {
			expect(cls).not.toMatch(/shadow/);
		}
	});

	test("merges an incoming className last", () => {
		expect(surfaceVariants().root({ className: "mt-3" })).toContain("mt-3");
		expect(surfaceVariants().root({ className: "bg-popover" })).not.toContain("bg-card");
		expect(surfaceVariants().root({ className: "p-8" })).not.toMatch(/\bp-4\b/);
	});

	// `border-continuous` is Uniwind's, and a merger that read it as a colour
	// would drop it the moment a caller tinted the border.
	test("keeps its corner curve when a caller recolours the border", () => {
		expect(surfaceVariants().root({ className: "border-destructive" })).toContain("border-continuous");
	});
});

describe("SURFACE_FOREGROUND_TOKENS", () => {
	test("names the X-foreground token for each fill", () => {
		expect(SURFACE_FOREGROUND_TOKENS).toEqual({
			default: "card-foreground",
			secondary: "secondary-foreground",
			tertiary: "tertiary-foreground",
		});
	});

	// Every token named here has to exist, or the class compiles to nothing and
	// the text keeps whatever colour it inherited.
	test("every token is declared in theme.css", () => {
		const css = readFileSync(join(import.meta.dir, "../../styles/theme.css"), "utf8");
		for (const token of Object.values(SURFACE_FOREGROUND_TOKENS)) {
			expect(css).toContain(`--color-${token}: var(--${token})`);
		}
	});
});

describe("resolveSurfaceVariant", () => {
	test("an explicit variant always wins", () => {
		for (const variant of SURFACE_VARIANTS) {
			expect(resolveSurfaceVariant({ parentPlane: null, variant })).toBe(variant);
			expect(resolveSurfaceVariant({ parentPlane: "secondary", variant })).toBe(variant);
		}
	});

	test("a top-level surface is the default card", () => {
		expect(resolveSurfaceVariant({ parentPlane: null })).toBe("default");
	});

	test("a nested surface steps to the next fill", () => {
		expect(resolveSurfaceVariant({ parentPlane: "default" })).toBe("secondary");
		expect(resolveSurfaceVariant({ parentPlane: "secondary" })).toBe("tertiary");
		expect(resolveSurfaceVariant({ parentPlane: "tertiary" })).toBe("secondary");
	});

	// The point of the ladder: whatever depth it is nested at, a surface never
	// resolves to the fill it is sitting on, or it would vanish into it.
	test("never resolves to the fill of the plane it sits on", () => {
		for (const parentPlane of SURFACE_FILLED_VARIANTS) {
			expect(resolveSurfaceVariant({ parentPlane })).not.toBe(parentPlane);
		}
	});

	test("never resolves to transparent on its own", () => {
		for (const parentPlane of [null, ...SURFACE_FILLED_VARIANTS]) {
			expect(resolveSurfaceVariant({ parentPlane })).not.toBe("transparent");
		}
	});
});

describe("resolveSurfacePlane", () => {
	test("a filled surface is the plane its children sit on", () => {
		for (const variant of SURFACE_FILLED_VARIANTS) {
			expect(resolveSurfacePlane({ parentPlane: null, variant })).toBe(variant);
			expect(resolveSurfacePlane({ parentPlane: "tertiary", variant })).toBe(variant);
		}
	});

	// A transparent surface paints nothing, so what its children sit on is
	// still whatever it sits on.
	test("a transparent surface passes its parent's plane through", () => {
		expect(resolveSurfacePlane({ parentPlane: null, variant: "transparent" })).toBeNull();
		for (const parentPlane of SURFACE_FILLED_VARIANTS) {
			expect(resolveSurfacePlane({ parentPlane, variant: "transparent" })).toBe(parentPlane);
		}
	});

	test("a surface inside a transparent one steps from the plane beneath both", () => {
		const through = resolveSurfacePlane({ parentPlane: "default", variant: "transparent" });
		expect(resolveSurfaceVariant({ parentPlane: through })).toBe("secondary");
	});
});
