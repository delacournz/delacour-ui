import { describe, expect, test } from "bun:test";
import {
	isCollapsed,
	resolveBarSurfaceOpacity,
	resolveBarTitleOpacity,
	resolveCollapseDistance,
	resolveCollapseProgress,
	resolveCoverStretch,
	resolveHeaderInset,
	resolveLargeOpacity,
	resolveSnapTarget,
	SCROLL_HEADER_BAR_SURFACES,
	SCROLL_HEADER_DEFAULT_BLUR_INTENSITY,
	SCROLL_HEADER_NO_LARGE_FADE_DISTANCE,
	SCROLL_HEADER_SNAP_VELOCITY,
	scrollHeaderVariants,
} from "./scroll-header.variants";

describe("resolveCollapseDistance", () => {
	test("is the Large block's height scaled by the threshold", () => {
		expect(resolveCollapseDistance({ largeHeight: 120, threshold: 1 })).toBe(120);
		expect(resolveCollapseDistance({ largeHeight: 120, threshold: 0.6 })).toBe(72);
	});

	test("clamps the threshold to 0.1..1", () => {
		expect(resolveCollapseDistance({ largeHeight: 120, threshold: 5 })).toBe(120);
		expect(resolveCollapseDistance({ largeHeight: 120, threshold: 0 })).toBe(12);
	});

	test("is 0 with no Large block, never negative", () => {
		expect(resolveCollapseDistance({ largeHeight: 0, threshold: 1 })).toBe(0);
		expect(resolveCollapseDistance({ largeHeight: -10, threshold: 1 })).toBe(0);
	});
});

describe("resolveCollapseProgress", () => {
	test("runs 0..1 across the distance and clamps outside it", () => {
		expect(resolveCollapseProgress(0, 100)).toBe(0);
		expect(resolveCollapseProgress(50, 100)).toBe(0.5);
		expect(resolveCollapseProgress(100, 100)).toBe(1);
		expect(resolveCollapseProgress(250, 100)).toBe(1);
		expect(resolveCollapseProgress(-40, 100)).toBe(0);
	});

	test("is a step at 0 when there is no distance", () => {
		expect(resolveCollapseProgress(10, 0)).toBe(1);
		expect(resolveCollapseProgress(0, 0)).toBe(0);
	});
});

describe("resolveHeaderInset", () => {
	test("sums the safe-area band, the bar and the Large block", () => {
		expect(resolveHeaderInset({ safeAreaTop: 59, barHeight: 48, largeHeight: 120 })).toBe(227);
		expect(resolveHeaderInset({ safeAreaTop: 0, barHeight: 48, largeHeight: 0 })).toBe(48);
	});
});

describe("resolveCoverStretch", () => {
	const baseHeight = 227;

	test("rests at its base height", () => {
		expect(resolveCoverStretch({ offset: 0, baseHeight, stretch: true })).toEqual({ height: 227, translateY: 0 });
	});

	test("scrolls away with the content", () => {
		expect(resolveCoverStretch({ offset: 100, baseHeight, stretch: true })).toEqual({ height: 227, translateY: -100 });
		expect(resolveCoverStretch({ offset: 500, baseHeight, stretch: true })).toEqual({ height: 227, translateY: -500 });
	});

	test("grows by the pull past the top when stretching", () => {
		expect(resolveCoverStretch({ offset: -60, baseHeight, stretch: true })).toEqual({ height: 287, translateY: 0 });
	});

	test("rides the pull instead of growing when not stretching", () => {
		expect(resolveCoverStretch({ offset: -60, baseHeight, stretch: false })).toEqual({ height: 227, translateY: 60 });
	});
});

describe("resolveSnapTarget", () => {
	const distance = 100;

	test("settles a half-scrolled header to the nearer end", () => {
		expect(resolveSnapTarget({ offset: 30, distance })).toBe(0);
		expect(resolveSnapTarget({ offset: 49.9, distance })).toBe(0);
		expect(resolveSnapTarget({ offset: 50, distance })).toBe(100);
		expect(resolveSnapTarget({ offset: 80, distance })).toBe(100);
	});

	test("leaves a header already at an end, past it, or pulled down alone", () => {
		expect(resolveSnapTarget({ offset: 0, distance })).toBeNull();
		expect(resolveSnapTarget({ offset: 100, distance })).toBeNull();
		expect(resolveSnapTarget({ offset: 150, distance })).toBeNull();
		expect(resolveSnapTarget({ offset: -20, distance })).toBeNull();
	});

	test("never snaps with no distance", () => {
		expect(resolveSnapTarget({ offset: 10, distance: 0 })).toBeNull();
	});
});

describe("isCollapsed", () => {
	test("only at full progress", () => {
		expect(isCollapsed(0.99)).toBe(false);
		expect(isCollapsed(1)).toBe(true);
	});
});

describe("resolveBarSurfaceOpacity", () => {
	test("follows progress with a Large block", () => {
		expect(resolveBarSurfaceOpacity({ hasLarge: true, progress: 0.4, offset: 999 })).toBe(0.4);
	});

	test("follows the offset over the fade distance without one", () => {
		expect(resolveBarSurfaceOpacity({ hasLarge: false, progress: 0, offset: 12 })).toBe(0.5);
		expect(resolveBarSurfaceOpacity({ hasLarge: false, progress: 0, offset: 0 })).toBe(0);
		expect(resolveBarSurfaceOpacity({ hasLarge: false, progress: 0, offset: 60 })).toBe(1);
	});
});

describe("the crossfade pair", () => {
	test("hands the title from the Large block to the bar", () => {
		expect(resolveLargeOpacity(0.25)).toBe(0.75);
		expect(resolveBarTitleOpacity(0.25)).toBe(0.25);
	});

	test("clamps outside 0..1", () => {
		expect(resolveLargeOpacity(-1)).toBe(1);
		expect(resolveLargeOpacity(2)).toBe(0);
		expect(resolveBarTitleOpacity(-1)).toBe(0);
		expect(resolveBarTitleOpacity(2)).toBe(1);
	});

	test("sums to 1 across the range", () => {
		for (let p = 0; p <= 1; p += 0.125) {
			expect(resolveLargeOpacity(p) + resolveBarTitleOpacity(p)).toBeCloseTo(1);
		}
	});
});

describe("constants", () => {
	test("pin the spec's numbers", () => {
		expect(SCROLL_HEADER_NO_LARGE_FADE_DISTANCE).toBe(24);
		expect(SCROLL_HEADER_SNAP_VELOCITY).toBe(0.15);
		expect(SCROLL_HEADER_DEFAULT_BLUR_INTENSITY).toBe(40);
		expect(SCROLL_HEADER_BAR_SURFACES).toEqual(["plain", "muted", "none", "blur"]);
	});
});

describe("scrollHeaderVariants", () => {
	test("each surface has its own fill", () => {
		expect(scrollHeaderVariants({ surface: "plain" }).barSurface()).toContain("bg-background");
		expect(scrollHeaderVariants({ surface: "muted" }).barSurface()).toContain("bg-muted");
		expect(scrollHeaderVariants({ surface: "none" }).barSurface()).toContain("bg-transparent");
		expect(scrollHeaderVariants({ surface: "blur" }).barSurface()).toContain("bg-transparent");
	});

	test("defaults to plain", () => {
		expect(scrollHeaderVariants().barSurface()).toContain("bg-background");
	});

	test("the bar row shares the navbar's row height", () => {
		expect(scrollHeaderVariants().barRow()).toContain("h-navbar-row");
	});

	test("the bar sits above the Large block, which sits above the scroller", () => {
		expect(scrollHeaderVariants().bar()).toContain("z-20");
		expect(scrollHeaderVariants().large()).toContain("z-10");
	});

	test("a caller's className reaches the root", () => {
		expect(scrollHeaderVariants().root({ className: "bg-card" })).toContain("bg-card");
	});
});
