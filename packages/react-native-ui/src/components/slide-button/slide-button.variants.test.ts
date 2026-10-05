import { describe, expect, test } from "bun:test";
import { aliasedTokens } from "../../styles/theme-tokens.test";
import {
	isSlideArmed,
	resolveSlideHandleWidth,
	resolveSlideLabelGutter,
	resolveSlideRelease,
	resolveSlideThreshold,
	resolveSlideTrailOpacity,
	resolveSlideTrailWidth,
	resolveSlideTravel,
	SLIDE_BUTTON_ARM_SLACK,
	SLIDE_BUTTON_DEFAULT_THRESHOLD,
	SLIDE_BUTTON_FAR_END_SLOP,
	SLIDE_BUTTON_GLYPH_TOKEN,
	SLIDE_BUTTON_HANDLE_RATIO,
	SLIDE_BUTTON_INSET,
	SLIDE_BUTTON_LOOKAHEAD,
	SLIDE_BUTTON_SIZES,
	SLIDE_BUTTON_SPRING,
	SLIDE_BUTTON_TRAIL_FADE,
	SLIDE_BUTTON_VARIANTS,
	slideButtonVariants,
} from "./slide-button.variants";

const ALIASED = aliasedTokens();

/** Every colour utility a class string names, with any opacity modifier dropped. */
function colourTokens(classes: string): string[] {
	return classes
		.split(/\s+/)
		.map((utility) => utility.match(/^(?:bg|text|border)-([a-z-]+?)(?:\/\d+)?$/)?.[1])
		.filter((name): name is string => name !== undefined)
		.filter((name) => name !== "center" && !name.startsWith("button-"));
}

describe("resolveSlideTrailOpacity", () => {
	test("no trail shows while the handle rests", () => {
		expect(resolveSlideTrailOpacity(0)).toBe(0);
		expect(resolveSlideTrailOpacity(-3)).toBe(0);
	});

	test("it fades in over the first few points, then holds", () => {
		expect(SLIDE_BUTTON_TRAIL_FADE).toBeGreaterThan(0);
		expect(resolveSlideTrailOpacity(SLIDE_BUTTON_TRAIL_FADE / 2)).toBeCloseTo(0.5);
		expect(resolveSlideTrailOpacity(SLIDE_BUTTON_TRAIL_FADE)).toBe(1);
		expect(resolveSlideTrailOpacity(200)).toBe(1);
	});
});

describe("resolveSlideTrailWidth", () => {
	test("runs from the rail's start edge to the handle's middle", () => {
		expect(resolveSlideTrailWidth({ handleWidth: 58, inset: 4, offset: 0 })).toBe(33);
		expect(resolveSlideTrailWidth({ handleWidth: 58, inset: 4, offset: 100 })).toBe(133);
	});
});

describe("resolveSlideLabelGutter", () => {
	test("keeps the label clear of the resting handle on both sides", () => {
		expect(resolveSlideLabelGutter({ handleWidth: 58, inset: 4 })).toBe(66);
	});

	test("is the inset alone before the handle is measured", () => {
		expect(resolveSlideLabelGutter({ handleWidth: 0, inset: 4 })).toBe(8);
	});
});

describe("resolveSlideThreshold", () => {
	test("defaults to 0.9", () => {
		expect(resolveSlideThreshold()).toBe(0.9);
		expect(SLIDE_BUTTON_DEFAULT_THRESHOLD).toBe(0.9);
	});

	test("NaN falls back to the default rather than poisoning every comparison", () => {
		expect(resolveSlideThreshold(Number.NaN)).toBe(0.9);
	});

	test("clamps into [0.1, 1]", () => {
		expect(resolveSlideThreshold(0)).toBe(0.1);
		expect(resolveSlideThreshold(-3)).toBe(0.1);
		expect(resolveSlideThreshold(1.5)).toBe(1);
		expect(resolveSlideThreshold(Number.POSITIVE_INFINITY)).toBe(1);
	});

	test("passes a value in range through untouched", () => {
		expect(resolveSlideThreshold(0.5)).toBe(0.5);
		expect(resolveSlideThreshold(1)).toBe(1);
		expect(resolveSlideThreshold(0.1)).toBe(0.1);
	});
});

describe("resolveSlideTravel", () => {
	test("is the rail less the handle and an inset at each end", () => {
		expect(resolveSlideTravel({ handleWidth: 58, inset: 4, railWidth: 300 })).toBe(234);
	});

	test("is zero before layout and never negative", () => {
		expect(resolveSlideTravel({ handleWidth: 0, inset: 4, railWidth: 0 })).toBe(0);
		expect(resolveSlideTravel({ handleWidth: 80, inset: 4, railWidth: 60 })).toBe(0);
	});
});

describe("resolveSlideHandleWidth", () => {
	test("is about 1.6 times the handle's height, which is the rail less an inset top and bottom", () => {
		expect(SLIDE_BUTTON_HANDLE_RATIO).toBe(1.6);
		expect(resolveSlideHandleWidth({ inset: 4, railHeight: 44 })).toBe(Math.round(36 * 1.6));
	});

	test("is zero before layout", () => {
		expect(resolveSlideHandleWidth({ inset: 4, railHeight: 0 })).toBe(0);
	});
});

describe("isSlideArmed", () => {
	test("arms at the threshold and disarms below it", () => {
		expect(isSlideArmed({ offset: 180, threshold: 0.9, travel: 200 })).toBe(true);
		expect(isSlideArmed({ offset: 179, threshold: 0.9, travel: 200 })).toBe(false);
	});

	test("with threshold 1 arms only at the far end", () => {
		expect(isSlideArmed({ offset: 199.6, threshold: 1, travel: 200 })).toBe(true);
		expect(isSlideArmed({ offset: 199, threshold: 1, travel: 200 })).toBe(false);
	});

	test("never arms before layout", () => {
		expect(isSlideArmed({ offset: 0, threshold: 0.1, travel: 0 })).toBe(false);
	});
});

describe("resolveSlideRelease", () => {
	const base = { lookahead: SLIDE_BUTTON_LOOKAHEAD, threshold: 0.9, travel: 200 } as const;

	test("a release past the threshold completes", () => {
		expect(resolveSlideRelease({ ...base, offset: 185, velocity: 0 })).toBe("complete");
	});

	test("a short release returns", () => {
		expect(resolveSlideRelease({ ...base, offset: 60, velocity: 0 })).toBe("return");
	});

	test("a committed flick from about 70% completes", () => {
		expect(resolveSlideRelease({ ...base, offset: 140, velocity: 1000 })).toBe("complete");
	});

	test("a lazy flick from halfway does not complete", () => {
		expect(resolveSlideRelease({ ...base, offset: 100, velocity: 300 })).toBe("return");
	});

	test("even a hard flick from halfway does not complete — the hand has to get close first", () => {
		expect(resolveSlideRelease({ ...base, offset: 100, velocity: 4000 })).toBe("return");
		expect(SLIDE_BUTTON_ARM_SLACK).toBe(0.25);
	});

	test("letting go past the threshold while pulling back returns", () => {
		expect(resolveSlideRelease({ ...base, offset: 185, velocity: -1500 })).toBe("return");
	});

	test("threshold 1 has no velocity shortcut and demands the far end", () => {
		const strict = { ...base, threshold: 1 };
		expect(resolveSlideRelease({ ...strict, offset: 150, velocity: 5000 })).toBe("return");
		expect(resolveSlideRelease({ ...strict, offset: 199, velocity: 5000 })).toBe("return");
		expect(resolveSlideRelease({ ...strict, offset: 200 - SLIDE_BUTTON_FAR_END_SLOP, velocity: 0 })).toBe("complete");
		expect(resolveSlideRelease({ ...strict, offset: 200, velocity: 0 })).toBe("complete");
	});

	test("never completes before layout", () => {
		expect(resolveSlideRelease({ ...base, offset: 0, travel: 0, velocity: 9000 })).toBe("return");
	});

	test("a low threshold completes from a short drag", () => {
		expect(resolveSlideRelease({ ...base, offset: 110, threshold: 0.5, velocity: 0 })).toBe("complete");
		expect(resolveSlideRelease({ ...base, offset: 90, threshold: 0.5, velocity: 0 })).toBe("return");
	});
});

describe("motion constants", () => {
	test("the handle is inset 4pt inside the rail", () => {
		expect(SLIDE_BUTTON_INSET).toBe(4);
	});

	test("the release spring overshoots only a little", () => {
		const ratio =
			SLIDE_BUTTON_SPRING.damping / (2 * Math.sqrt(SLIDE_BUTTON_SPRING.stiffness * SLIDE_BUTTON_SPRING.mass));
		expect(ratio).toBeGreaterThan(0.7);
	});
});

describe("slideButtonVariants", () => {
	test("TODO(category lead): compare against progressButtonVariants at merge — each size's rail is a button-height capsule", () => {
		for (const size of SLIDE_BUTTON_SIZES) {
			const root = slideButtonVariants({ size }).root().split(/\s+/);
			expect(root).toContain(`h-button-${size}`);
			expect(root).toContain(`rounded-button-${size}`);
		}
	});

	test("the label takes the button's type step at each size", () => {
		for (const size of SLIDE_BUTTON_SIZES) {
			expect(slideButtonVariants({ size }).label().split(/\s+/)).toContain(`text-button-${size}`);
		}
	});

	test("the label frame fills the rail and centres its text", () => {
		const frame = slideButtonVariants().labelFrame().split(/\s+/);
		expect(frame).toEqual(expect.arrayContaining(["absolute", "inset-0", "justify-center"]));
		expect(slideButtonVariants().label()).toContain("text-center");
		expect(slideButtonVariants().label()).not.toContain("absolute");
	});

	test("the label over the trail takes the trail's own foreground", () => {
		expect(slideButtonVariants({ variant: "secondary" }).labelOnTrail()).toContain("text-secondary-foreground");
		expect(slideButtonVariants({ variant: "destructive" }).labelOnTrail()).toContain("text-destructive-foreground");
		expect(slideButtonVariants({ variant: "success" }).labelOnTrail()).toContain("text-success-foreground");
	});

	test("the trail clip is pinned to the start edge and clips", () => {
		const clip = slideButtonVariants().labelClip().split(/\s+/);
		expect(clip).toEqual(expect.arrayContaining(["absolute", "start-0", "top-0", "bottom-0", "overflow-hidden"]));
	});

	test("the glyph takes the icon step that matches the size", () => {
		expect(slideButtonVariants({ size: "sm" }).thumbGlyph()).toContain("size-icon-sm");
		expect(slideButtonVariants({ size: "md" }).thumbGlyph()).toContain("size-icon-md");
		expect(slideButtonVariants({ size: "lg" }).thumbGlyph()).toContain("size-icon-lg");
	});

	test("there is no primary variant", () => {
		expect(SLIDE_BUTTON_VARIANTS).toEqual(["secondary", "destructive", "success"]);
	});

	test("secondary sits on bg-secondary and trails in a faint foreground", () => {
		const slots = slideButtonVariants({ variant: "secondary" });
		expect(slots.root()).toContain("bg-secondary");
		expect(slots.trail()).toContain("bg-foreground/15");
	});

	test("a state variant sits on its soft fill and trails in its full colour", () => {
		for (const variant of ["destructive", "success"] as const) {
			const slots = slideButtonVariants({ variant });
			expect(slots.root()).toContain(`bg-${variant}-soft`);
			expect(slots.trail().split(/\s+/)).toContain(`bg-${variant}`);
			expect(slots.label()).toContain(`text-${variant}-soft-foreground`);
		}
	});

	test("the handle is neutral in every variant", () => {
		for (const variant of SLIDE_BUTTON_VARIANTS) {
			const thumb = slideButtonVariants({ variant }).thumb();
			expect(thumb).toContain("bg-background");
			expect(thumb).toContain("border-border");
		}
		expect(SLIDE_BUTTON_GLYPH_TOKEN).toBe("foreground");
	});

	test("the label colour is on the label, never the rail", () => {
		for (const variant of SLIDE_BUTTON_VARIANTS) {
			expect(slideButtonVariants({ variant }).root()).not.toMatch(/\btext-/);
		}
	});

	test("disabled fades the whole control", () => {
		expect(slideButtonVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(slideButtonVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("full width stretches the rail", () => {
		expect(slideButtonVariants({ isFullWidth: true }).root()).toContain("w-full");
		expect(slideButtonVariants({ isFullWidth: false }).root()).not.toContain("w-full");
	});

	test("every colour named exists in the theme", () => {
		for (const variant of SLIDE_BUTTON_VARIANTS) {
			const slots = slideButtonVariants({ variant });
			const classes = [
				slots.root(),
				slots.trail(),
				slots.label(),
				slots.labelOnTrail(),
				slots.thumb(),
				slots.thumbGlyph(),
			].join(" ");
			const tokens = colourTokens(classes);
			expect(tokens.length).toBeGreaterThan(0);
			for (const token of tokens) expect(ALIASED.has(`--color-${token}`)).toBe(true);
		}
		expect(ALIASED.has(`--color-${SLIDE_BUTTON_GLYPH_TOKEN}`)).toBe(true);
	});
});
