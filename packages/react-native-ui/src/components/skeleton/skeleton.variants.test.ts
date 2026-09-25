import { describe, expect, test } from "bun:test";
import {
	resolveSkeletonAccessibility,
	resolveSkeletonAnimation,
	resolveSkeletonLineWidths,
	SKELETON_ANIMATIONS,
	SKELETON_FILL_CLASS,
	SKELETON_LAST_LINE_WIDTH,
	SKELETON_PULSE_MIN_OPACITY,
	SKELETON_SHAPES,
	SKELETON_SHIMMER_PEAK_OPACITY,
	SKELETON_SHIMMER_STOPS,
	skeletonPulseOpacity,
	skeletonShimmerOffset,
	skeletonVariants,
} from "./skeleton.variants";

describe("resolveSkeletonAnimation", () => {
	test("passes every requested animation through when motion is allowed", () => {
		for (const animation of SKELETON_ANIMATIONS) {
			expect(resolveSkeletonAnimation(animation, false)).toBe(animation);
		}
	});

	// The shape is the message. A placeholder that stops moving still reads as
	// content on its way, so reduce-motion stills it rather than hiding it.
	test("stills every animation under reduce motion", () => {
		for (const animation of SKELETON_ANIMATIONS) {
			expect(resolveSkeletonAnimation(animation, true)).toBe("none");
		}
	});

	test("shimmers by default", () => {
		expect(resolveSkeletonAnimation(undefined, false)).toBe("shimmer");
	});
});

describe("skeletonPulseOpacity", () => {
	test("starts and ends a cycle fully opaque, so the loop has no seam", () => {
		expect(skeletonPulseOpacity(0)).toBeCloseTo(1, 10);
		expect(skeletonPulseOpacity(1)).toBeCloseTo(1, 10);
	});

	test("reaches its floor half way through the cycle", () => {
		expect(skeletonPulseOpacity(0.5)).toBeCloseTo(SKELETON_PULSE_MIN_OPACITY, 10);
	});

	test("never leaves the band between the floor and opaque", () => {
		for (let step = 0; step <= 100; step++) {
			const opacity = skeletonPulseOpacity(step / 100);
			expect(opacity).toBeGreaterThanOrEqual(SKELETON_PULSE_MIN_OPACITY - 1e-9);
			expect(opacity).toBeLessThanOrEqual(1 + 1e-9);
		}
	});

	test("is symmetric, so it breathes in and out at one rate", () => {
		expect(skeletonPulseOpacity(0.2)).toBeCloseTo(skeletonPulseOpacity(0.8), 10);
	});

	// A floor at zero would make the placeholder blink out of existence, which
	// reads as a layout that is failing rather than one that is loading.
	test("keeps the floor visible", () => {
		expect(SKELETON_PULSE_MIN_OPACITY).toBeGreaterThan(0.3);
		expect(SKELETON_PULSE_MIN_OPACITY).toBeLessThan(1);
	});
});

describe("skeletonShimmerOffset", () => {
	// Both ends of the sweep sit fully outside the placeholder, so the band
	// enters from nothing and leaves to nothing and the loop has no visible jump.
	test("starts wholly off the leading edge", () => {
		expect(skeletonShimmerOffset(0, 200, 80)).toBe(-80);
	});

	test("ends wholly off the trailing edge", () => {
		expect(skeletonShimmerOffset(1, 200, 80)).toBe(200);
	});

	test("advances linearly", () => {
		const a = skeletonShimmerOffset(0.25, 200, 80);
		const b = skeletonShimmerOffset(0.5, 200, 80);
		const c = skeletonShimmerOffset(0.75, 200, 80);
		expect(b - a).toBeCloseTo(c - b, 10);
	});

	test("stays off-screen before the placeholder has been measured", () => {
		expect(skeletonShimmerOffset(0.5, 0, 80)).toBeLessThanOrEqual(0);
	});
});

describe("SKELETON_SHIMMER_STOPS", () => {
	test("fades in from nothing and back out to nothing", () => {
		expect(SKELETON_SHIMMER_STOPS.at(0)).toEqual({ offset: 0, opacity: 0 });
		expect(SKELETON_SHIMMER_STOPS.at(-1)).toEqual({ offset: 1, opacity: 0 });
	});

	test("peaks in the middle of the band", () => {
		const peak = SKELETON_SHIMMER_STOPS.reduce((best, stop) => (stop.opacity > best.opacity ? stop : best));
		expect(peak.offset).toBe(0.5);
		expect(peak.opacity).toBe(SKELETON_SHIMMER_PEAK_OPACITY);
	});

	test("is symmetric about its centre", () => {
		const offsets = SKELETON_SHIMMER_STOPS.map((stop) => stop.offset);
		const mirrored = [...SKELETON_SHIMMER_STOPS].reverse().map((stop) => 1 - stop.offset);
		expect(mirrored).toEqual(offsets);
	});

	test("advances along the band", () => {
		for (const [index, stop] of SKELETON_SHIMMER_STOPS.slice(1).entries()) {
			expect(stop.offset).toBeGreaterThan(SKELETON_SHIMMER_STOPS[index]?.offset ?? 1);
		}
	});
});

describe("resolveSkeletonLineWidths", () => {
	test("gives one width per line", () => {
		expect(resolveSkeletonLineWidths(4)).toHaveLength(4);
	});

	test("shortens only the last line, the way a paragraph ends", () => {
		expect(resolveSkeletonLineWidths(3)).toEqual(["100%", "100%", `${SKELETON_LAST_LINE_WIDTH * 100}%`]);
	});

	test("takes a custom last-line fraction", () => {
		expect(resolveSkeletonLineWidths(2, 0.4)).toEqual(["100%", "40%"]);
	});

	// A single line is a title or a label, and whoever wrote it knows how long
	// it is. Shortening it would second-guess a width they did not ask for.
	test("leaves a single line full width", () => {
		expect(resolveSkeletonLineWidths(1)).toEqual(["100%"]);
	});

	test("draws nothing for a count below one or a fraction", () => {
		expect(resolveSkeletonLineWidths(0)).toEqual([]);
		expect(resolveSkeletonLineWidths(-2)).toEqual([]);
		expect(resolveSkeletonLineWidths(2.7)).toHaveLength(2);
	});

	test("clamps the last-line fraction into the line", () => {
		expect(resolveSkeletonLineWidths(2, 1.5)).toEqual(["100%", "100%"]);
		expect(resolveSkeletonLineWidths(2, -1)).toEqual(["100%", "0%"]);
	});
});

describe("resolveSkeletonAccessibility", () => {
	test("hides an unlabelled placeholder from assistive technology", () => {
		const a11y = resolveSkeletonAccessibility({ isLoading: true });
		expect(a11y.kind).toBe("hidden");
		expect(a11y.props.accessibilityElementsHidden).toBe(true);
		expect(a11y.props.importantForAccessibility).toBe("no-hide-descendants");
	});

	test("announces a labelled placeholder once, as a busy status", () => {
		const a11y = resolveSkeletonAccessibility({ isLoading: true, label: "Loading messages" });
		expect(a11y.kind).toBe("status");
		expect(a11y.props.accessible).toBe(true);
		expect(a11y.props.accessibilityLabel).toBe("Loading messages");
		expect(a11y.props.accessibilityRole).toBe("progressbar");
		expect(a11y.props.accessibilityState).toEqual({ busy: true });
	});

	test("treats an empty label as no label", () => {
		expect(resolveSkeletonAccessibility({ isLoading: true, label: "" }).kind).toBe("hidden");
	});

	// Once the content has landed it speaks for itself; the skeleton must not
	// sit between it and a screen reader.
	test("steps aside entirely once loaded", () => {
		for (const label of [undefined, "Loading"]) {
			const a11y = resolveSkeletonAccessibility({ isLoading: false, label });
			expect(a11y.kind).toBe("content");
			expect(a11y.props).toEqual({});
		}
	});
});

describe("skeletonVariants root slot", () => {
	test("paints and clips only while loading", () => {
		const loading = skeletonVariants({ isLoading: true }).root();
		expect(loading).toContain(SKELETON_FILL_CLASS);
		expect(loading).toContain("overflow-hidden");

		const loaded = skeletonVariants({ isLoading: false }).root();
		expect(loaded).not.toContain(SKELETON_FILL_CLASS);
	});

	test("gives every shape a corner", () => {
		for (const shape of SKELETON_SHAPES) {
			expect(skeletonVariants({ shape }).root()).toMatch(/\brounded-/);
		}
	});

	test("draws a circle as a circle", () => {
		expect(skeletonVariants({ shape: "circle" }).root()).toContain("rounded-full");
	});

	// With children the content sizes the placeholder, so a default size would
	// only fight it — and would clip the content once it lands.
	test("sizes a childless shape, and leaves a wrapping one to its content", () => {
		for (const shape of SKELETON_SHAPES) {
			expect(skeletonVariants({ shape, isEmpty: true }).root()).toMatch(/\b(h|size)-/);
			expect(skeletonVariants({ shape, isEmpty: false }).root()).not.toMatch(/\b(h|w|size)-/);
		}
	});

	test("lets a caller's size beat the shape's default", () => {
		const cls = skeletonVariants({ shape: "circle", isEmpty: true }).root({ className: "size-16" });
		expect(cls).toContain("size-16");
		expect(cls).not.toContain("size-10");
	});

	test("lets a caller's corner beat the shape's", () => {
		const cls = skeletonVariants({ shape: "rect" }).root({ className: "rounded-full" });
		expect(cls).toContain("rounded-full");
		expect(cls).not.toContain("rounded-lg");
	});
});

describe("SKELETON_FILL_CLASS", () => {
	// An opaque surface token sits too close to the light page to read. A tint
	// of a foreground colour steps off any surface it lands on, in both themes.
	test("is a translucent tint of a foreground colour", () => {
		expect(SKELETON_FILL_CLASS).toMatch(/^bg-[\w-]*foreground\/\d+$/);
	});
});

describe("skeletonVariants band slot", () => {
	test("is pinned to the leading edge and spans the full height", () => {
		const cls = skeletonVariants().band();
		expect(cls).toContain("absolute");
		expect(cls).toContain("left-0");
		expect(cls).toContain("inset-y-0");
	});

	// A share of the placeholder, bounded both ways — and a class, so Yoga sizes
	// it and no frame of the sweep has to write a layout prop.
	test("takes its width from layout, as a bounded share of the placeholder", () => {
		const cls = skeletonVariants().band();
		expect(cls).toContain("w-3/5");
		expect(cls).toContain("min-w-12");
		expect(cls).toContain("max-w-60");
	});
});
