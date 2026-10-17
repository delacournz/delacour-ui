import { describe, expect, test } from "bun:test";
import { aliasedTokens, declaredTokens, tokenValue } from "../../styles/theme-tokens.test";
import {
	imageViewerVariants,
	isSameImage,
	resolveBackdropOpacity,
	resolveClampedTranslation,
	resolveCloseTarget,
	resolveCornerRadiusAt,
	resolveDismissDecision,
	resolveDismissScale,
	resolveDoubleTapTarget,
	resolveDragAxis,
	resolveFittedRect,
	resolveFrameAt,
	resolveGalleryOrder,
	resolveNextZoomStep,
	resolveOriginVisible,
	resolvePinchTransform,
	resolvePreviousZoomStep,
	resolveTranslateBounds,
	resolveViewerA11yValue,
	resolveViewerIndex,
	VIEWER_DISMISS_DISTANCE_FRACTION,
	VIEWER_DISMISS_VELOCITY,
	VIEWER_DOUBLE_TAP_SCALE,
	VIEWER_MAX_SCALE,
	VIEWER_PAGE_GAP_POINTS,
	VIEWER_SPRING,
} from "./image-viewer.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

const NO_INSETS = { bottom: 0, left: 0, right: 0, top: 0 };
const WINDOW = { height: 800, width: 400 };

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, , token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (/^(xs|sm|base|lg|xl|\dxl|left|center|right|[tblrxyse])$/.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

/** The slots this component declares, pinned so a new one cannot escape the sweeps below. */
const SLOT_NAMES = [
	"trigger",
	"backdrop",
	"chrome",
	"counter",
	"caption",
	"captionFrame",
	"error",
	"errorText",
] as const;

describe("the media tokens", () => {
	test("are declared in both themes and aliased", () => {
		for (const token of ["media", "media-foreground"]) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
			expect(aliasedTokens().has(`--color-${token}`)).toBe(true);
		}
	});

	// Derived, so a pasted palette drags the stage along: dark in both themes.
	test("are derived from foreground and background", () => {
		expect(tokenValue("light", "media")).toBe("var(--foreground)");
		expect(tokenValue("dark", "media")).toBe("var(--background)");
		expect(tokenValue("light", "media-foreground")).toBe("var(--background)");
		expect(tokenValue("dark", "media-foreground")).toBe("var(--foreground)");
	});
});

describe("imageViewerVariants", () => {
	test("every colour a slot paints is declared in both themes", () => {
		const slots = imageViewerVariants();
		for (const name of SLOT_NAMES) {
			for (const token of colorTokens(slots[name]())) {
				expect({ name, token, light: LIGHT.has(token) }).toEqual({ name, token, light: true });
				expect({ name, token, dark: DARK.has(token) }).toEqual({ name, token, dark: true });
			}
		}
	});

	test("the stage and its chrome paint with the media pair", () => {
		const slots = imageViewerVariants();
		expect(colorTokens(slots.backdrop())).toContain("media");
		expect(colorTokens(slots.counter())).toContain("media-foreground");
		expect(colorTokens(slots.caption())).toContain("media-foreground");
		expect(colorTokens(slots.errorText())).toContain("media-foreground");
	});

	test("no self-*, no dark: prefix, no raw palette colour", () => {
		const slots = imageViewerVariants();
		for (const name of SLOT_NAMES) {
			const cls = slots[name]();
			expect(cls).not.toMatch(/(^|\s)self-/);
			expect(cls).not.toMatch(/(^|\s)dark:/);
			expect(cls).not.toMatch(
				/\b(bg|text|border)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/
			);
		}
	});

	test("the trigger clips and shows a muted swatch while loading", () => {
		const trigger = imageViewerVariants().trigger();
		expect(trigger).toContain("overflow-hidden");
		expect(trigger).toContain("bg-muted");
	});

	test("text colour sits on the Text, never its frame (rule 1)", () => {
		const slots = imageViewerVariants();
		expect(slots.chrome()).not.toMatch(/\btext-/);
		expect(slots.captionFrame()).not.toMatch(/\btext-/);
		expect(slots.error()).not.toMatch(/\btext-/);
	});

	test("a caller's className wins the merge", () => {
		expect(imageViewerVariants().trigger({ className: "bg-card" })).toContain("bg-card");
		expect(imageViewerVariants().trigger({ className: "bg-card" })).not.toContain("bg-muted");
	});
});

describe("constants", () => {
	test("match the spec", () => {
		expect(VIEWER_MAX_SCALE).toBe(4);
		expect(VIEWER_DOUBLE_TAP_SCALE).toBe(2.5);
		expect(VIEWER_PAGE_GAP_POINTS).toBe(16);
		expect(VIEWER_DISMISS_DISTANCE_FRACTION).toBe(0.15);
		expect(VIEWER_DISMISS_VELOCITY).toBe(800);
		expect(VIEWER_SPRING.damping).toBeGreaterThan(0);
	});
});

describe("resolveFittedRect", () => {
	test("a wide image is width-bound and centred vertically", () => {
		const rect = resolveFittedRect(1.5, WINDOW, NO_INSETS);
		expect(rect.x).toBe(0);
		expect(rect.width).toBe(400);
		expect(rect.height).toBeCloseTo(266.67, 1);
		expect(rect.y).toBeCloseTo((800 - 266.67) / 2, 1);
	});

	test("a 1:2 image fills the window exactly", () => {
		const rect = resolveFittedRect(0.5, WINDOW, NO_INSETS);
		expect(rect).toEqual({ height: 800, width: 400, x: 0, y: 0 });
	});

	test("a tall image is height-bound and centred horizontally", () => {
		const rect = resolveFittedRect(0.4, WINDOW, NO_INSETS);
		expect(rect.width).toBeCloseTo(320, 5);
		expect(rect.x).toBeCloseTo(40, 5);
		expect(rect.height).toBe(800);
	});

	test("insets shrink the box before fitting", () => {
		const rect = resolveFittedRect(0.4, WINDOW, { bottom: 34, left: 0, right: 0, top: 50 });
		expect(rect.y).toBe(50);
		expect(rect.height).toBe(716);
		expect(rect.width).toBeCloseTo(286.4, 5);
	});

	test("a bad aspect fills the box", () => {
		expect(resolveFittedRect(0, WINDOW, NO_INSETS)).toEqual({ height: 800, width: 400, x: 0, y: 0 });
		expect(resolveFittedRect(Number.NaN, WINDOW, NO_INSETS)).toEqual({ height: 800, width: 400, x: 0, y: 0 });
		expect(resolveFittedRect(-1, WINDOW, NO_INSETS)).toEqual({ height: 800, width: 400, x: 0, y: 0 });
	});

	test("an unmeasured window is a zero rect", () => {
		expect(resolveFittedRect(1, { height: 0, width: 0 }, NO_INSETS)).toEqual({ height: 0, width: 0, x: 0, y: 0 });
	});
});

describe("resolveFrameAt", () => {
	const origin = { height: 100, width: 100, x: 20, y: 300 };
	const fitted = { height: 400, width: 400, x: 0, y: 200 };

	test("0 is the origin and 1 the fitted rect", () => {
		expect(resolveFrameAt(0, origin, fitted)).toEqual(origin);
		expect(resolveFrameAt(1, origin, fitted)).toEqual(fitted);
	});

	test("0.5 is the midpoint of every number", () => {
		expect(resolveFrameAt(0.5, origin, fitted)).toEqual({ height: 250, width: 250, x: 10, y: 250 });
	});

	test("progress is clamped", () => {
		expect(resolveFrameAt(-1, origin, fitted)).toEqual(origin);
		expect(resolveFrameAt(2, origin, fitted)).toEqual(fitted);
	});
});

describe("resolveCornerRadiusAt", () => {
	test("goes from the thumbnail's corner to square", () => {
		expect(resolveCornerRadiusAt(0, 12)).toBe(12);
		expect(resolveCornerRadiusAt(1, 12)).toBe(0);
		expect(resolveCornerRadiusAt(0.5, 12)).toBe(6);
	});
});

describe("resolveTranslateBounds", () => {
	const fitted = { height: 400 / 1.5, width: 400 };

	test("nothing to pan at rest", () => {
		expect(resolveTranslateBounds(1, { height: 800, width: 400 }, WINDOW)).toEqual({ maxX: 0, maxY: 0 });
	});

	test("an image shorter than the window stays centred until it overflows", () => {
		const bounds = resolveTranslateBounds(2, fitted, WINDOW);
		expect(bounds.maxX).toBe(200);
		expect(bounds.maxY).toBe(0);
	});

	test("overflow on both axes", () => {
		const bounds = resolveTranslateBounds(4, fitted, WINDOW);
		expect(bounds.maxX).toBe(600);
		expect(bounds.maxY).toBeCloseTo(133.33, 1);
	});

	test("below 1 is no bounds at all", () => {
		expect(resolveTranslateBounds(0.5, fitted, WINDOW)).toEqual({ maxX: 0, maxY: 0 });
	});
});

describe("resolveClampedTranslation", () => {
	const bounds = { maxX: 100, maxY: 50 };

	test("inside is unchanged", () => {
		expect(resolveClampedTranslation({ x: 40, y: -20 }, bounds)).toEqual({ x: 40, y: -20 });
	});

	test("outside is the bound", () => {
		expect(resolveClampedTranslation({ x: 140, y: -90 }, bounds)).toEqual({ x: 100, y: -50 });
	});

	test("a rubber band gives, but less than it was asked", () => {
		const banded = resolveClampedTranslation({ x: 140, y: -90 }, bounds, true);
		expect(banded.x).toBeGreaterThan(100);
		expect(banded.x).toBeLessThan(140);
		expect(banded.y).toBeLessThan(-50);
		expect(banded.y).toBeGreaterThan(-90);
	});
});

describe("resolvePinchTransform", () => {
	const center = { x: 200, y: 400 };
	const base = { center, maxScale: 4, startScale: 1, startTranslation: { x: 0, y: 0 } };

	test("about the centre, only the scale changes", () => {
		const result = resolvePinchTransform({ ...base, focal: center, pinchScale: 2 });
		expect(result.scale).toBe(2);
		expect(result.translation.x).toBeCloseTo(0, 5);
		expect(result.translation.y).toBeCloseTo(0, 5);
	});

	test("the point under the fingers stays put", () => {
		const result = resolvePinchTransform({ ...base, focal: { x: 300, y: 400 }, pinchScale: 2 });
		expect(result.scale).toBe(2);
		expect(result.translation.x).toBeCloseTo(-100, 5);
		expect(result.translation.y).toBeCloseTo(0, 5);
	});

	test("rubber-bands below 1", () => {
		const result = resolvePinchTransform({ ...base, focal: center, pinchScale: 0.5 });
		expect(result.scale).toBeGreaterThan(0.5);
		expect(result.scale).toBeLessThan(1);
	});

	test("rubber-bands past maxScale", () => {
		const result = resolvePinchTransform({ ...base, focal: center, pinchScale: 8 });
		expect(result.scale).toBeGreaterThan(4);
		expect(result.scale).toBeLessThan(8);
	});

	test("a moving focal pans the image with the fingers", () => {
		const result = resolvePinchTransform({ ...base, focal: center, focalDelta: { x: 30, y: -10 }, pinchScale: 1 });
		expect(result.translation).toEqual({ x: 30, y: -10 });
	});
});

describe("resolveDoubleTapTarget", () => {
	const center = { x: 200, y: 400 };
	const bounds = { maxX: 300, maxY: 300 };

	test("at rest it zooms in about the tap", () => {
		const result = resolveDoubleTapTarget({ bounds, center, doubleTapScale: 2.5, scale: 1, tap: { x: 300, y: 400 } });
		expect(result.scale).toBe(2.5);
		expect(result.translation.x).toBeCloseTo(-150, 5);
		expect(result.translation.y).toBeCloseTo(0, 5);
	});

	test("a tap at the centre zooms straight in", () => {
		const result = resolveDoubleTapTarget({ bounds, center, doubleTapScale: 2.5, scale: 1, tap: center });
		expect(result.translation.x).toBeCloseTo(0, 5);
		expect(result.translation.y).toBeCloseTo(0, 5);
	});

	test("a tap near the edge clamps to the bounds", () => {
		const result = resolveDoubleTapTarget({
			bounds: { maxX: 100, maxY: 0 },
			center,
			doubleTapScale: 2.5,
			scale: 1,
			tap: { x: 0, y: 0 },
		});
		expect(result.translation).toEqual({ x: 100, y: 0 });
	});

	test("zoomed it resets", () => {
		const result = resolveDoubleTapTarget({ bounds, center, doubleTapScale: 2.5, scale: 3, tap: { x: 10, y: 10 } });
		expect(result).toEqual({ scale: 1, translation: { x: 0, y: 0 } });
	});
});

describe("zoom steps", () => {
	test("zoom in steps 1 → double-tap → max, and stops", () => {
		expect(resolveNextZoomStep(1, 2.5, 4)).toBe(2.5);
		expect(resolveNextZoomStep(2.5, 2.5, 4)).toBe(4);
		expect(resolveNextZoomStep(4, 2.5, 4)).toBe(4);
		expect(resolveNextZoomStep(1.4, 2.5, 4)).toBe(2.5);
	});

	test("zoom out steps back, floor 1", () => {
		expect(resolvePreviousZoomStep(4, 2.5)).toBe(2.5);
		expect(resolvePreviousZoomStep(2.5, 2.5)).toBe(1);
		expect(resolvePreviousZoomStep(1, 2.5)).toBe(1);
		expect(resolvePreviousZoomStep(3, 2.5)).toBe(2.5);
	});
});

describe("resolveDragAxis", () => {
	test("the first axis past the threshold wins", () => {
		expect(resolveDragAxis({ activateAt: 10, translationX: 12, translationY: 3 })).toBe("horizontal");
		expect(resolveDragAxis({ activateAt: 10, translationX: 3, translationY: 12 })).toBe("vertical");
		expect(resolveDragAxis({ activateAt: 10, translationX: -12, translationY: -3 })).toBe("horizontal");
	});

	test("neither past it is undecided", () => {
		expect(resolveDragAxis({ activateAt: 10, translationX: 6, translationY: 6 })).toBe("undecided");
	});
});

describe("resolveDismissDecision", () => {
	test("distance past 15% dismisses, either way", () => {
		expect(resolveDismissDecision(150, 0, 800)).toBe("dismiss");
		expect(resolveDismissDecision(-150, 0, 800)).toBe("dismiss");
		expect(resolveDismissDecision(100, 0, 800)).toBe("restore");
	});

	test("a flick dismisses; a flick back against the drag cancels", () => {
		expect(resolveDismissDecision(30, 900, 800)).toBe("dismiss");
		expect(resolveDismissDecision(100, -900, 800)).toBe("restore");
		expect(resolveDismissDecision(150, -900, 800)).toBe("restore");
	});
});

describe("resolveBackdropOpacity", () => {
	test("fades out over half a window, both ways", () => {
		expect(resolveBackdropOpacity(0, 800)).toBe(1);
		expect(resolveBackdropOpacity(200, 800)).toBe(0.5);
		expect(resolveBackdropOpacity(-200, 800)).toBe(0.5);
		expect(resolveBackdropOpacity(400, 800)).toBe(0);
		expect(resolveBackdropOpacity(900, 800)).toBe(0);
	});

	test("an unmeasured window is opaque", () => {
		expect(resolveBackdropOpacity(100, 0)).toBe(1);
	});
});

describe("resolveDismissScale", () => {
	test("shrinks gently to a floor of 0.8 at half a window", () => {
		expect(resolveDismissScale(0, 800)).toBe(1);
		expect(resolveDismissScale(200, 800)).toBeCloseTo(0.9, 5);
		expect(resolveDismissScale(400, 800)).toBeCloseTo(0.8, 5);
		expect(resolveDismissScale(-900, 800)).toBeCloseTo(0.8, 5);
	});
});

describe("closing", () => {
	test("flies home only to a visible origin, and never under calm motion", () => {
		expect(resolveCloseTarget({ calm: false, originVisible: true })).toBe("origin");
		expect(resolveCloseTarget({ calm: false, originVisible: false })).toBe("fade");
		expect(resolveCloseTarget({ calm: true, originVisible: true })).toBe("fade");
	});

	test("an origin is visible while any of it is on screen", () => {
		expect(resolveOriginVisible({ height: 100, width: 100, x: 0, y: -100 }, WINDOW)).toBe(false);
		expect(resolveOriginVisible({ height: 100, width: 100, x: 0, y: 900 }, WINDOW)).toBe(false);
		expect(resolveOriginVisible({ height: 100, width: 100, x: 500, y: 0 }, WINDOW)).toBe(false);
		expect(resolveOriginVisible({ height: 100, width: 100, x: 0, y: -50 }, WINDOW)).toBe(true);
		expect(resolveOriginVisible(null, WINDOW)).toBe(false);
		expect(resolveOriginVisible({ height: 0, width: 0, x: 10, y: 10 }, WINDOW)).toBe(false);
	});
});

describe("resolveViewerIndex", () => {
	test("clamps into the gallery", () => {
		expect(resolveViewerIndex(5, 3)).toBe(2);
		expect(resolveViewerIndex(-1, 3)).toBe(0);
		expect(resolveViewerIndex(0, 0)).toBe(0);
		expect(resolveViewerIndex(1.6, 3)).toBe(2);
	});
});

describe("resolveGalleryOrder", () => {
	const image = (id: string, alt = id) => ({ alt, id, source: { uri: `https://example.com/${id}.jpg` } });

	test("sorts by mount sequence", () => {
		const order = resolveGalleryOrder([
			{ image: image("b"), sequence: 2 },
			{ image: image("a"), sequence: 1 },
			{ image: image("c"), sequence: 3 },
		]);
		expect(order.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
	});

	test("a duplicate id keeps the first position and the last data", () => {
		const order = resolveGalleryOrder([
			{ image: image("a", "first"), sequence: 1 },
			{ image: image("b"), sequence: 2 },
			{ image: image("a", "second"), sequence: 3 },
		]);
		expect(order.map((entry) => entry.id)).toEqual(["a", "b"]);
		expect(order[0]?.alt).toBe("second");
	});
});

describe("isSameImage", () => {
	test("compares by value, so a fresh { uri } literal is not a change", () => {
		const a = { alt: "A", id: "a", source: { uri: "x" } };
		expect(isSameImage(a, { alt: "A", id: "a", source: { uri: "x" } })).toBe(true);
		expect(isSameImage(a, { alt: "B", id: "a", source: { uri: "x" } })).toBe(false);
		expect(isSameImage(a, { alt: "A", id: "a", source: { uri: "y" } })).toBe(false);
		expect(isSameImage({ alt: "A", id: "a", source: 3 }, { alt: "A", id: "a", source: 3 })).toBe(true);
		expect(isSameImage(a, { ...a, fullSource: { uri: "z" } })).toBe(false);
	});
});

describe("resolveViewerA11yValue", () => {
	test("reads n of m", () => {
		expect(resolveViewerA11yValue(1, 5)).toBe("2 of 5");
		expect(resolveViewerA11yValue(0, 0)).toBe("");
	});
});
