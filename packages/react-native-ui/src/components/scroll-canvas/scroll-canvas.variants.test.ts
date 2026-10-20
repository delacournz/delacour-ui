import { describe, expect, test } from "bun:test";
import type { ScrollCanvasProps } from "./scroll-canvas.types";
import {
	resolveCanvasAccessibility,
	resolveEffectProgress,
	resolveEffectWindow,
	resolveParallax,
	resolveReveal,
	resolveSequenceIndex,
	resolveStaticProgress,
	resolveZoom,
	SCROLL_CANVAS_DEFAULT_ASPECT,
	SCROLL_CANVAS_DEFAULT_DISTANCE,
	SCROLL_CANVAS_EFFECTS,
	SCROLL_CANVAS_SEQUENCE_WARN_FRAMES,
	scrollCanvasVariants,
} from "./scroll-canvas.variants";

describe("constants", () => {
	test("pin the documented defaults", () => {
		expect(SCROLL_CANVAS_EFFECTS).toEqual(["parallax", "zoom", "reveal", "sequence"]);
		expect(SCROLL_CANVAS_DEFAULT_DISTANCE).toBe(0.2);
		expect(SCROLL_CANVAS_DEFAULT_ASPECT).toBe(16 / 10);
		expect(SCROLL_CANVAS_SEQUENCE_WARN_FRAMES).toBe(30);
	});
});

describe("resolveEffectWindow", () => {
	// Parallax runs for the frame's whole time on screen: it starts as the top
	// enters at the bottom and ends as the bottom leaves at the top.
	test("parallax runs from entering to just leaving", () => {
		expect(resolveEffectWindow({ effect: "parallax", frameHeight: 200, viewport: 800 })).toEqual({
			start: 1,
			end: -0.25,
		});
	});

	test("every other effect completes with the frame 30% down the viewport", () => {
		for (const effect of ["zoom", "reveal", "sequence"] as const) {
			expect(resolveEffectWindow({ effect, frameHeight: 200, viewport: 800 })).toEqual({ start: 1, end: 0.3 });
		}
	});

	test("an override wins over the default", () => {
		expect(resolveEffectWindow({ effect: "parallax", frameHeight: 200, viewport: 800, end: 0 })).toEqual({
			start: 1,
			end: 0,
		});
		expect(resolveEffectWindow({ effect: "zoom", frameHeight: 200, viewport: 800, start: 0.8 })).toEqual({
			start: 0.8,
			end: 0.3,
		});
	});

	test("an unmeasured viewport does not divide by zero", () => {
		expect(resolveEffectWindow({ effect: "parallax", frameHeight: 200, viewport: 0 })).toEqual({ start: 1, end: -1 });
	});
});

describe("resolveEffectProgress", () => {
	const window = { start: 1, end: 0.3 };

	test("is 0 as the frame enters at the bottom", () => {
		expect(resolveEffectProgress({ offset: 0, frameTop: 800, viewport: 800, window })).toBe(0);
	});

	test("is half way with the frame top at 0.65 of the viewport", () => {
		expect(resolveEffectProgress({ offset: 280, frameTop: 800, viewport: 800, window })).toBeCloseTo(0.5, 10);
	});

	test("is complete at the end of the window", () => {
		expect(resolveEffectProgress({ offset: 560, frameTop: 800, viewport: 800, window })).toBeCloseTo(1, 10);
	});

	test("clamps past either end, overscroll included", () => {
		expect(resolveEffectProgress({ offset: 900, frameTop: 800, viewport: 800, window })).toBe(1);
		expect(resolveEffectProgress({ offset: -50, frameTop: 800, viewport: 800, window })).toBe(0);
	});

	test("a zero-width window is a step at its end", () => {
		const step = { start: 0.5, end: 0.5 };
		expect(resolveEffectProgress({ offset: 0, frameTop: 480, viewport: 800, window: step })).toBe(0);
		expect(resolveEffectProgress({ offset: 0, frameTop: 320, viewport: 800, window: step })).toBe(1);
	});

	test("an unmeasured viewport holds the start", () => {
		expect(resolveEffectProgress({ offset: 500, frameTop: 0, viewport: 0, window })).toBe(0);
	});
});

describe("resolveParallax", () => {
	test("starts with the image shifted up by its travel, bottom edge flush", () => {
		expect(resolveParallax({ progress: 0, frameHeight: 200, distance: 0.2 })).toEqual({
			imageHeight: 280,
			imageTop: -40,
			translateY: -40,
		});
	});

	test("centres half way and ends shifted down by its travel", () => {
		expect(resolveParallax({ progress: 0.5, frameHeight: 200, distance: 0.2 }).translateY).toBeCloseTo(0, 10);
		expect(resolveParallax({ progress: 1, frameHeight: 200, distance: 0.2 }).translateY).toBeCloseTo(40, 10);
	});

	// The image never shows a frame edge: its top is never below the frame's
	// top, and its bottom never above the frame's bottom.
	test("never exposes a frame edge across the whole travel", () => {
		for (let step = 0; step <= 20; step++) {
			const { imageHeight, imageTop, translateY } = resolveParallax({
				progress: step / 20,
				frameHeight: 200,
				distance: 0.2,
			});
			expect(imageTop + translateY).toBeLessThanOrEqual(1e-9);
			expect(imageTop + translateY + imageHeight).toBeGreaterThanOrEqual(200 - 1e-9);
		}
	});

	test("no distance is no motion", () => {
		const still = resolveParallax({ progress: 0, frameHeight: 200, distance: 0 });
		expect(still.imageHeight).toBe(200);
		expect(still.translateY).toBe(0);
	});

	test("distance clamps to the frame height", () => {
		expect(resolveParallax({ progress: 0, frameHeight: 200, distance: 3 })).toEqual({
			imageHeight: 600,
			imageTop: -200,
			translateY: -200,
		});
	});
});

describe("resolveZoom", () => {
	test("settles from oversized to natural", () => {
		expect(resolveZoom({ progress: 0, distance: 0.2 }).scale).toBeCloseTo(1.2, 10);
		expect(resolveZoom({ progress: 0.5, distance: 0.2 }).scale).toBeCloseTo(1.1, 10);
		expect(resolveZoom({ progress: 1, distance: 0.2 }).scale).toBe(1);
	});

	test("never shrinks below natural", () => {
		expect(resolveZoom({ progress: 0, distance: -1 }).scale).toBe(1);
	});
});

describe("resolveReveal", () => {
	test("the cover retreats upward by the frame height", () => {
		expect(resolveReveal({ progress: 0, frameHeight: 200 }).coverTranslateY).toBe(0);
		expect(resolveReveal({ progress: 0.5, frameHeight: 200 }).coverTranslateY).toBe(-100);
		expect(resolveReveal({ progress: 1, frameHeight: 200 }).coverTranslateY).toBe(-200);
	});
});

describe("resolveSequenceIndex", () => {
	test("splits progress into equal bands", () => {
		expect(resolveSequenceIndex(0, 4)).toBe(0);
		expect(resolveSequenceIndex(0.24, 4)).toBe(0);
		expect(resolveSequenceIndex(0.25, 4)).toBe(1);
		expect(resolveSequenceIndex(0.49, 4)).toBe(1);
		expect(resolveSequenceIndex(0.99, 4)).toBe(3);
	});

	test("the last frame owns progress 1", () => {
		expect(resolveSequenceIndex(1, 4)).toBe(3);
	});

	test("one frame, no frames and negative progress all land on 0", () => {
		expect(resolveSequenceIndex(0.7, 1)).toBe(0);
		expect(resolveSequenceIndex(0.5, 0)).toBe(0);
		expect(resolveSequenceIndex(-1, 4)).toBe(0);
	});
});

describe("resolveStaticProgress", () => {
	test("draws each effect's resting state", () => {
		expect(resolveStaticProgress("parallax")).toBe(0.5);
		expect(resolveStaticProgress("zoom")).toBe(1);
		expect(resolveStaticProgress("reveal")).toBe(1);
		expect(resolveStaticProgress("sequence")).toBe(0);
	});
});

describe("resolveCanvasAccessibility", () => {
	test("a label makes the frame one image", () => {
		expect(resolveCanvasAccessibility("Fog over a ridge")).toEqual({
			accessible: true,
			accessibilityRole: "image",
			accessibilityLabel: "Fog over a ridge",
		});
	});

	test("no label is decorative and hidden", () => {
		expect(resolveCanvasAccessibility(undefined)).toEqual({
			accessible: false,
			importantForAccessibility: "no-hide-descendants",
		});
		expect(resolveCanvasAccessibility("")).toEqual({
			accessible: false,
			importantForAccessibility: "no-hide-descendants",
		});
	});
});

describe("scrollCanvasVariants", () => {
	test("frame is a clipped, card-cornered placeholder", () => {
		const slots = scrollCanvasVariants();
		expect(slots.frame()).toBe("relative w-full overflow-hidden rounded-lg bg-muted");
		expect(slots.image()).toBe("absolute inset-x-0 w-full");
		expect(slots.cover()).toBe("absolute inset-0 bg-background");
	});

	test("a caller's classes merge last", () => {
		const slots = scrollCanvasVariants();
		expect(slots.frame({ className: "rounded-none" })).toBe("relative w-full overflow-hidden bg-muted rounded-none");
		expect(slots.cover({ className: "bg-card" })).toBe("absolute inset-0 bg-card");
	});
});

describe("ScrollCanvasProps", () => {
	test("the effect decides whether it takes one source or many", () => {
		const one = { uri: "a" };
		const parallax: ScrollCanvasProps = { source: one };
		const sequence: ScrollCanvasProps = { effect: "sequence", sources: [one, one] };
		// @ts-expect-error a sequence takes `sources`, never `source`
		const wrongSequence: ScrollCanvasProps = { effect: "sequence", source: one };
		// @ts-expect-error a single-image effect takes `source`, never `sources`
		const wrongZoom: ScrollCanvasProps = { effect: "zoom", source: one, sources: [one] };
		// @ts-expect-error a sequence has no cover
		const wrongCover: ScrollCanvasProps = { effect: "sequence", sources: [one], coverClassName: "bg-card" };
		expect([parallax, sequence, wrongSequence, wrongZoom, wrongCover]).toHaveLength(5);
	});
});
