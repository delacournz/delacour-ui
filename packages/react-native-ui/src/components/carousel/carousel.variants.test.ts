import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	CAROUSEL_CALM_DURATION_MS,
	CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS,
	CAROUSEL_DEFAULT_MAX_DOTS,
	CAROUSEL_DEFAULT_WINDOW_SIZE,
	CAROUSEL_DOT_ACTIVE_POINTS,
	CAROUSEL_DOT_POINTS,
	CAROUSEL_GAP_POINTS,
	CAROUSEL_PAN,
	CAROUSEL_SPRING,
	COVERFLOW_MIN_OPACITY,
	COVERFLOW_MIN_SCALE,
	COVERFLOW_PERSPECTIVE,
	COVERFLOW_ROTATE_DEG,
	carouselVariants,
	resolveAutoplayEnabled,
	resolveAutoplayNext,
	resolveCaptionOpacity,
	resolveCarouselA11yValue,
	resolveClampedIndex,
	resolveCoverflow,
	resolveDotLength,
	resolveDotsWindow,
	resolveItemInset,
	resolveItemPitch,
	resolveItemSize,
	resolveNavigationState,
	resolveSlideAccessibility,
	resolveSlideTranslate,
} from "./carousel.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		if (utility === "text" && /^(xs|sm|base|lg|xl|\dxl|left|center|right)$/.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

/**
 * The slots this component declares, pinned rather than derived — `tv` adds a
 * `base` slot of its own, and a new slot has to be added here before the sweep
 * below can miss it.
 */
const SLOT_NAMES = [
	"root",
	"viewport",
	"item",
	"captionFrame",
	"caption",
	"controls",
	"dots",
	"dot",
	"dotActive",
] as const;

const COMBINATIONS = (["track", "coverflow"] as const).flatMap((variant) =>
	(["horizontal", "vertical"] as const).flatMap((orientation) =>
		(["default", "overlay"] as const).map((tone) => carouselVariants({ orientation, tone, variant }))
	)
);

describe("carouselVariants", () => {
	test("every colour a slot paints is declared in both themes", () => {
		for (const slots of COMBINATIONS) {
			for (const name of SLOT_NAMES) {
				for (const token of colorTokens(slots[name]())) {
					expect({ name, token, light: LIGHT.has(token) }).toEqual({ name, token, light: true });
					expect({ name, token, dark: DARK.has(token) }).toEqual({ name, token, dark: true });
				}
			}
		}
	});

	test("the reader found the tokens at all", () => {
		const slots = carouselVariants();
		expect(colorTokens(slots.dot())).toContain("foreground");
		expect(colorTokens(slots.caption())).toContain("foreground");
	});

	test("no self-*, no dark: prefix, no raw palette colour", () => {
		for (const slots of COMBINATIONS) {
			for (const name of SLOT_NAMES) {
				const cls = slots[name]();
				expect(cls).not.toMatch(/(^|\s)self-/);
				expect(cls).not.toMatch(/(^|\s)dark:/);
				expect(cls).not.toMatch(
					/\b(bg|text|border)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/
				);
			}
		}
	});

	test("a slide is absolutely placed on the card corner and clips", () => {
		const item = carouselVariants().item();
		expect(item).toContain("absolute");
		expect(item).toContain("overflow-hidden");
		expect(item).toContain("rounded-lg");
	});

	test("the viewport clips the slides it holds", () => {
		expect(carouselVariants().viewport()).toContain("overflow-hidden");
	});

	test("caption colour sits on the Text, never its frame (rule 1)", () => {
		expect(carouselVariants().caption()).toContain("text-foreground");
		expect(carouselVariants().captionFrame()).not.toMatch(/\btext-/);
	});

	test("vertical turns the controls and the dots into columns", () => {
		expect(carouselVariants({ orientation: "horizontal" }).controls()).toContain("flex-row");
		expect(carouselVariants({ orientation: "vertical" }).controls()).toContain("flex-col");
		expect(carouselVariants({ orientation: "horizontal" }).dots()).toContain("flex-row");
		expect(carouselVariants({ orientation: "vertical" }).dots()).toContain("flex-col");
	});

	test("overlay dots are drawn in the primary foreground, default dots in the foreground", () => {
		expect(carouselVariants({ tone: "default" }).dot()).toContain("bg-foreground/30");
		expect(carouselVariants({ tone: "default" }).dotActive()).toContain("bg-foreground");
		expect(carouselVariants({ tone: "overlay" }).dot()).toContain("bg-primary-foreground/40");
		expect(carouselVariants({ tone: "overlay" }).dot()).not.toContain("bg-foreground/30");
		expect(carouselVariants({ tone: "overlay" }).dotActive()).toContain("bg-primary-foreground");
	});

	test("a caller's className wins the merge", () => {
		expect(carouselVariants().root({ className: "gap-6" })).toContain("gap-6");
		expect(carouselVariants().root({ className: "gap-6" })).not.toContain("gap-3");
	});
});

describe("constants", () => {
	test("are the documented numbers", () => {
		expect(CAROUSEL_GAP_POINTS).toBe(12);
		expect(CAROUSEL_DOT_POINTS).toBe(6);
		expect(CAROUSEL_DOT_ACTIVE_POINTS).toBe(18);
		expect(COVERFLOW_ROTATE_DEG).toBe(35);
		expect(COVERFLOW_MIN_SCALE).toBe(0.85);
		expect(COVERFLOW_MIN_OPACITY).toBe(0.5);
		expect(COVERFLOW_PERSPECTIVE).toBe(800);
		expect(CAROUSEL_CALM_DURATION_MS).toBe(150);
		expect(CAROUSEL_DEFAULT_WINDOW_SIZE).toBe(2);
		expect(CAROUSEL_DEFAULT_MAX_DOTS).toBe(7);
		expect(CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS).toBe(4000);
		expect(CAROUSEL_PAN.activate).toBe(10);
		expect(CAROUSEL_PAN.fail).toBe(10);
		expect(CAROUSEL_SPRING.damping).toBeGreaterThan(0);
	});

	test("the dot's resting size is its `h-1.5` class", () => {
		expect(carouselVariants().dot()).toContain("h-1.5");
		expect(CAROUSEL_DOT_POINTS).toBe(1.5 * 4);
	});
});

describe("resolveItemSize", () => {
	test("is the viewport when omitted or too big", () => {
		expect(resolveItemSize(360, undefined)).toBe(360);
		expect(resolveItemSize(360, 500)).toBe(360);
	});

	test("is the item size when it fits", () => {
		expect(resolveItemSize(360, 300)).toBe(300);
	});

	test("is 0 before the viewport is measured", () => {
		expect(resolveItemSize(0, 300)).toBe(0);
	});
});

describe("resolveItemPitch", () => {
	test("is a full slide plus the gap, so neighbours are off-screen", () => {
		expect(resolveItemPitch(360, undefined, 12)).toBe(372);
	});

	test("is the item size plus the gap when neighbours peek", () => {
		expect(resolveItemPitch(360, 300, 12)).toBe(312);
	});

	test("clamps an item larger than the viewport", () => {
		expect(resolveItemPitch(360, 500, 12)).toBe(372);
	});

	test("is 0 before the viewport is measured", () => {
		expect(resolveItemPitch(0, 300, 12)).toBe(0);
	});
});

describe("resolveItemInset", () => {
	test("centres a smaller slide", () => {
		expect(resolveItemInset(360, 300)).toBe(30);
	});

	test("is 0 for a slide as big as the viewport", () => {
		expect(resolveItemInset(360, undefined)).toBe(0);
		expect(resolveItemInset(360, 360)).toBe(0);
		expect(resolveItemInset(360, 500)).toBe(0);
	});
});

describe("resolveSlideTranslate", () => {
	test("is the inset plus the offset in pitches", () => {
		expect(resolveSlideTranslate(0, 312, 30)).toBe(30);
		expect(resolveSlideTranslate(1, 312, 30)).toBe(342);
		expect(resolveSlideTranslate(-0.5, 312, 30)).toBe(-126);
	});
});

describe("resolveCoverflow", () => {
	test("is the identity on the active slide", () => {
		expect(resolveCoverflow(0, false)).toEqual({ opacity: 1, rotateY: 0, scale: 1 });
	});

	test("one slide right faces left, shrunk and dimmed", () => {
		const one = resolveCoverflow(1, false);
		expect(one.scale).toBeCloseTo(COVERFLOW_MIN_SCALE);
		expect(one.rotateY).toBeCloseTo(-COVERFLOW_ROTATE_DEG);
		expect(one.opacity).toBeCloseTo(0.75);
	});

	test("clamps at the floors two slides out and beyond", () => {
		for (const offset of [2, 3, 10]) {
			const far = resolveCoverflow(offset, false);
			expect(far.scale).toBeCloseTo(COVERFLOW_MIN_SCALE);
			expect(far.opacity).toBeCloseTo(COVERFLOW_MIN_OPACITY);
			expect(far.rotateY).toBeCloseTo(-COVERFLOW_ROTATE_DEG);
		}
		expect(resolveCoverflow(-4, false).rotateY).toBeCloseTo(COVERFLOW_ROTATE_DEG);
	});

	test("is halfway at half a slide", () => {
		const half = resolveCoverflow(0.5, false);
		expect(half.scale).toBeCloseTo((1 + COVERFLOW_MIN_SCALE) / 2);
		expect(half.rotateY).toBeCloseTo(-COVERFLOW_ROTATE_DEG / 2);
		expect(half.opacity).toBeCloseTo(0.875);
	});

	test("is symmetric: rotation mirrors, scale and opacity match", () => {
		for (const offset of [0.3, 0.8, 1.5, 2.5]) {
			const right = resolveCoverflow(offset, false);
			const left = resolveCoverflow(-offset, false);
			expect(left.scale).toBeCloseTo(right.scale);
			expect(left.opacity).toBeCloseTo(right.opacity);
			expect(left.rotateY).toBeCloseTo(-right.rotateY);
		}
	});

	test("calm motion collapses to the identity", () => {
		expect(resolveCoverflow(1, true)).toEqual({ opacity: 1, rotateY: 0, scale: 1 });
	});
});

describe("resolveDotsWindow", () => {
	test("is every dot when they fit", () => {
		expect(resolveDotsWindow(5, 2, 7)).toEqual({ end: 5, start: 0 });
	});

	test("pins to the start and the end", () => {
		expect(resolveDotsWindow(10, 0, 5)).toEqual({ end: 5, start: 0 });
		expect(resolveDotsWindow(10, 9, 5)).toEqual({ end: 10, start: 5 });
	});

	test("centres on the active dot in the middle", () => {
		expect(resolveDotsWindow(10, 5, 5)).toEqual({ end: 8, start: 3 });
	});

	test("is empty with nothing to show", () => {
		expect(resolveDotsWindow(0, 0, 5)).toEqual({ end: 0, start: 0 });
		expect(resolveDotsWindow(0, 3, 7)).toEqual({ end: 0, start: 0 });
	});
});

describe("resolveDotLength", () => {
	test("grows from the resting dot to the active pill as the offset closes", () => {
		expect(resolveDotLength(0)).toBe(CAROUSEL_DOT_ACTIVE_POINTS);
		expect(resolveDotLength(1)).toBe(CAROUSEL_DOT_POINTS);
		expect(resolveDotLength(-3)).toBe(CAROUSEL_DOT_POINTS);
		expect(resolveDotLength(0.5)).toBe((CAROUSEL_DOT_POINTS + CAROUSEL_DOT_ACTIVE_POINTS) / 2);
	});
});

describe("resolveCaptionOpacity", () => {
	test("fades out over one slide either way", () => {
		expect(resolveCaptionOpacity(0)).toBe(1);
		expect(resolveCaptionOpacity(0.25)).toBe(0.75);
		expect(resolveCaptionOpacity(-0.5)).toBe(0.5);
		expect(resolveCaptionOpacity(1)).toBe(0);
		expect(resolveCaptionOpacity(2)).toBe(0);
	});
});

describe("resolveAutoplayNext", () => {
	test("steps forward", () => {
		expect(resolveAutoplayNext(2, 5, true)).toEqual({ next: 3, stop: false });
		expect(resolveAutoplayNext(2, 5, false)).toEqual({ next: 3, stop: false });
	});

	test("wraps when looping", () => {
		expect(resolveAutoplayNext(4, 5, true)).toEqual({ next: 0, stop: false });
	});

	test("stops at the end when not looping", () => {
		expect(resolveAutoplayNext(4, 5, false)).toEqual({ next: 4, stop: true });
	});

	test("stops with one slide or none", () => {
		expect(resolveAutoplayNext(0, 1, true).stop).toBe(true);
		expect(resolveAutoplayNext(0, 0, true).stop).toBe(true);
	});
});

describe("resolveAutoplayEnabled", () => {
	const on = { autoplay: true, count: 3, isCalm: false, isDisabled: false, isScreenReader: false };

	test("runs only when asked, with motion, no screen reader, enabled and more than one slide", () => {
		expect(resolveAutoplayEnabled(on)).toBe(true);
		expect(resolveAutoplayEnabled({ ...on, autoplay: false })).toBe(false);
		expect(resolveAutoplayEnabled({ ...on, isCalm: true })).toBe(false);
		expect(resolveAutoplayEnabled({ ...on, isScreenReader: true })).toBe(false);
		expect(resolveAutoplayEnabled({ ...on, isDisabled: true })).toBe(false);
		expect(resolveAutoplayEnabled({ ...on, count: 1 })).toBe(false);
		expect(resolveAutoplayEnabled({ ...on, count: 0 })).toBe(false);
	});
});

describe("resolveCarouselA11yValue", () => {
	test("is one-based n of m", () => {
		expect(resolveCarouselA11yValue(1, 5)).toBe("2 of 5");
		expect(resolveCarouselA11yValue(0, 1)).toBe("1 of 1");
	});

	test("is empty with nothing to count", () => {
		expect(resolveCarouselA11yValue(0, 0)).toBe("");
	});
});

describe("resolveNavigationState", () => {
	test("disables the arrow at each end when not looping", () => {
		expect(resolveNavigationState(0, 5, false)).toEqual({ canGoNext: true, canGoPrevious: false });
		expect(resolveNavigationState(4, 5, false)).toEqual({ canGoNext: false, canGoPrevious: true });
		expect(resolveNavigationState(2, 5, false)).toEqual({ canGoNext: true, canGoPrevious: true });
	});

	test("enables both when looping more than one slide", () => {
		expect(resolveNavigationState(0, 5, true)).toEqual({ canGoNext: true, canGoPrevious: true });
		expect(resolveNavigationState(4, 2, true)).toEqual({ canGoNext: true, canGoPrevious: true });
	});

	test("disables both with one slide or none", () => {
		expect(resolveNavigationState(0, 1, true)).toEqual({ canGoNext: false, canGoPrevious: false });
		expect(resolveNavigationState(0, 0, false)).toEqual({ canGoNext: false, canGoPrevious: false });
	});
});

describe("resolveClampedIndex", () => {
	test("leaves an index in range alone", () => {
		expect(resolveClampedIndex(2, 5)).toBe(2);
	});

	test("pulls a dead index back into the run", () => {
		expect(resolveClampedIndex(7, 5)).toBe(4);
		expect(resolveClampedIndex(-1, 5)).toBe(0);
		expect(resolveClampedIndex(1.6, 5)).toBe(2);
	});

	test("is 0 with nothing to index", () => {
		expect(resolveClampedIndex(3, 0)).toBe(0);
	});
});

describe("resolveSlideAccessibility", () => {
	test("the active slide is reachable", () => {
		expect(resolveSlideAccessibility({ isActive: true, isPeek: false })).toEqual({
			accessibilityElementsHidden: false,
			importantForAccessibility: "auto",
		});
	});

	test("a hidden neighbour is hidden from assistive tech", () => {
		expect(resolveSlideAccessibility({ isActive: false, isPeek: false })).toEqual({
			accessibilityElementsHidden: true,
			importantForAccessibility: "no-hide-descendants",
		});
	});

	test("a peeking neighbour stays reachable, because it is visible", () => {
		expect(resolveSlideAccessibility({ isActive: false, isPeek: true })).toEqual({
			accessibilityElementsHidden: false,
			importantForAccessibility: "auto",
		});
	});
});
