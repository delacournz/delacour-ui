import { describe, expect, test } from "bun:test";
import {
	CHAT_COMPOSER_GAP,
	footerAboveKeyboard,
	footerOccupancy,
	resolveFooterBorderOpacity,
	resolveNavbarBorderOpacity,
	resolveScreenEdgePadding,
	resolveScreenViewPadding,
	resolveScrollBottomInset,
	SCREEN_BORDER_FADE_DISTANCE,
	SCREEN_EDGES,
	SCREEN_FLOATING_BOTTOM_GAP,
	SCREEN_FOOTER_PADDING,
	SCREEN_PLACEMENTS,
	SCREEN_SCROLL_INSET_MODES,
	screenVariants,
} from "./screen.variants";

/** Top padding + bottom gap — the footer's own chrome around its measured content. */
const CHROME = SCREEN_FOOTER_PADDING + SCREEN_FLOATING_BOTTOM_GAP;

/** Slots that are containers: a `View` cannot cascade colour to a `Text` child. */
const CONTAINER_SLOTS = [
	"root",
	"content",
	"view",
	"header",
	"navbar",
	"navbarRow",
	"navbarStart",
	"navbarActions",
	"navbarCenter",
	"navbarBackground",
	"navbarBorder",
	"backButton",
	"footer",
	"footerBackground",
	"footerBorder",
	"footerContent",
	"loading",
	"errorContent",
] as const;

/** Slots that render a `Text` and must therefore carry their own colour. */
const TEXT_SLOTS = ["navbarTitle", "navbarSubtitle", "errorTitle", "errorMessage"] as const;

describe("footerOccupancy", () => {
	test("wraps the measured content in the footer's own chrome and the safe-area band", () => {
		expect(footerOccupancy(58, 34)).toBe(120);
		expect(footerOccupancy(58, 0)).toBe(86);
	});

	test("gaps the bottom by the floating gap, not the footer's own padding", () => {
		const inset = 34;
		const pillBottomEdge = footerOccupancy(58, inset) - SCREEN_FOOTER_PADDING - 58;
		expect(pillBottomEdge).toBe(inset + SCREEN_FLOATING_BOTTOM_GAP);
	});

	test("tracks the safe-area inset instead of a hardcoded stand-in", () => {
		for (const inset of [0, 20, 21, 34, 48]) {
			expect(footerOccupancy(58, inset) - footerOccupancy(58, 0)).toBe(inset);
		}
	});

	test("tracks the measured content height 1:1 — an attachment strip must be reserved", () => {
		expect(footerOccupancy(58 + 88, 34) - footerOccupancy(58, 34)).toBe(88);
	});

	test("counts both vertical edges, not one", () => {
		expect(footerOccupancy(0, 0)).toBe(CHROME);
	});
});

describe("footerAboveKeyboard", () => {
	// The whole reason two functions exist. The sticky shift parks the footer's
	// safe-area band behind the keyboard, so counting it in a `bottomOffset`
	// would scroll the focused input further than it needs to go.
	test("differs from occupancy by exactly the safe-area band", () => {
		for (const inset of [0, 21, 34]) {
			expect(footerOccupancy(58, inset) - footerAboveKeyboard(58)).toBe(inset);
		}
	});

	test("still covers the footer's own chrome — the input must clear the composer", () => {
		expect(footerAboveKeyboard(58)).toBe(86);
		expect(footerAboveKeyboard(0)).toBe(CHROME);
	});
});

describe("the layout constants", () => {
	test("are positive lengths, so a reserve is never negative", () => {
		for (const value of [SCREEN_FOOTER_PADDING, SCREEN_FLOATING_BOTTOM_GAP, CHAT_COMPOSER_GAP]) {
			expect(value).toBeGreaterThan(0);
		}
	});
});

describe("screenVariants placement", () => {
	test("defaults to overlay, the placement a screen's chrome floats at", () => {
		expect(screenVariants().navbar()).toContain("absolute");
		expect(screenVariants().footer()).toContain("absolute");
	});

	test("pins the navbar to the top and the footer to the bottom", () => {
		const navbar = screenVariants({ placement: "overlay" }).navbar();
		expect(navbar).toContain("top-0");
		expect(navbar).not.toContain("bottom-0");

		const footer = screenVariants({ placement: "overlay" }).footer();
		expect(footer).toContain("bottom-0");
		expect(footer).not.toContain("top-0");
	});

	test("stretches both across the full width, or an overlay would shrink to its content", () => {
		for (const slot of ["navbar", "footer"] as const) {
			const cls = screenVariants({ placement: "overlay" })[slot]();
			expect(cls).toContain("right-0");
			expect(cls).toContain("left-0");
		}
	});

	test("backs a static footer, so content lifted under it cannot show through", () => {
		// The backing travels with the keyboard translation. Without it a static
		// footer pushed up over the content is legible only where the content
		// happens to be blank.
		expect(screenVariants({ placement: "static" }).footerBackground()).toContain("bg-background");
	});

	test("leaves an overlay footer transparent, since content is meant to scroll under it", () => {
		expect(screenVariants({ placement: "overlay" }).footerBackground()).not.toContain("bg-background");
	});

	test("rules a static footer along its TOP edge, mirroring the navbar's bottom one", () => {
		const cls = screenVariants({ placement: "static" }).footerBorder();
		expect(cls).toContain("top-0");
		expect(cls).not.toContain("bottom-0");
		expect(cls).toContain("h-px");
		expect(cls).toContain("bg-border");
	});

	test("draws no hairline on an overlay footer, which floats rather than divides", () => {
		expect(screenVariants({ placement: "overlay" }).footerBorder()).not.toContain("bg-border");
	});

	test("puts the two hairlines on opposite edges", () => {
		expect(screenVariants().navbarBorder()).toContain("bottom-0");
		expect(screenVariants({ placement: "static" }).footerBorder()).toContain("top-0");
	});

	test("fills its box at either placement, so the backing cannot be a partial band", () => {
		for (const placement of SCREEN_PLACEMENTS) {
			const cls = screenVariants({ placement }).footerBackground();
			expect(cls).toContain("absolute");
			for (const edge of ["top-0", "right-0", "bottom-0", "left-0"]) {
				expect(cls).toContain(edge);
			}
		}
	});

	test("returns a static navbar and footer to the flow", () => {
		for (const slot of ["navbar", "footer"] as const) {
			const cls = screenVariants({ placement: "static" })[slot]();
			expect(cls).toContain("relative");
			expect(cls).not.toContain("absolute");
		}
	});

	test("gives every placement a distinct treatment on both slots", () => {
		for (const slot of ["navbar", "footer"] as const) {
			const seen = new Set(SCREEN_PLACEMENTS.map((placement) => screenVariants({ placement })[slot]()));
			expect(seen.size).toBe(SCREEN_PLACEMENTS.length);
		}
	});

	test("raises the navbar above the content it overlays at either placement", () => {
		// The navbar is a screen's FIRST child, so document order alone would
		// paint the content over it. The footer needs no such help — it is last.
		for (const placement of SCREEN_PLACEMENTS) {
			expect(screenVariants({ placement }).navbar()).toContain("z-50");
		}
	});
});

describe("screenVariants colour", () => {
	test("keeps text colour off every container", () => {
		const slots = screenVariants();
		for (const slot of CONTAINER_SLOTS) {
			expect(slots[slot]()).not.toMatch(/\btext-/);
		}
	});

	test("puts a colour on every text slot, since a View cannot cascade one", () => {
		const slots = screenVariants();
		for (const slot of TEXT_SLOTS) {
			expect(slots[slot]()).toMatch(/\btext-(foreground|muted-foreground)\b/);
		}
	});

	test("leaves the navbar's title and subtitle unaligned, so a stacked pair reads left", () => {
		// The `center` slot centres them by flex; forcing `text-center` here would
		// centre a single line inside a leading column that should read left.
		for (const slot of ["navbarTitle", "navbarSubtitle"] as const) {
			expect(screenVariants()[slot]()).not.toMatch(/\btext-(center|right|left)\b/);
		}
	});

	test("paints the navbar background and its hairline from theme tokens, never a literal", () => {
		expect(screenVariants().navbarBackground()).toContain("bg-background");
		expect(screenVariants().navbarBorder()).toContain("bg-border");
		for (const slot of ["navbarBackground", "navbarBorder"] as const) {
			expect(screenVariants()[slot]()).not.toMatch(/#[0-9a-f]{3,8}|rgba?\(/i);
		}
	});

	test("clips the navbar background, so the hairline stays inside the navbar's box", () => {
		expect(screenVariants().navbarBackground()).toContain("overflow-hidden");
	});
});

describe("screenVariants sizing", () => {
	test("lines the header and the navbar row up on one gutter token", () => {
		expect(screenVariants().header()).toContain("px-screen-gutter");
		expect(screenVariants().navbarRow()).toContain("px-screen-gutter");
	});

	test("sizes the navbar's control row from its token, not a raw utility", () => {
		expect(screenVariants().navbarRow()).toContain("h-navbar-row");
		expect(screenVariants().navbarRow()).not.toMatch(/\bh-\[/);
	});

	test("lets the navbar's start slot shrink, so a long title truncates rather than pushing the actions out", () => {
		expect(screenVariants().navbarStart()).toContain("min-w-0");
		expect(screenVariants().navbarStart()).toContain("flex-1");
	});

	test("fills the screen from the root down, so a child's flex-1 has a height to resolve against", () => {
		for (const slot of ["root", "content", "view"] as const) {
			expect(screenVariants()[slot]()).toContain("flex-1");
		}
	});
});

describe("screenVariants className", () => {
	test("merges the caller's class last, so an override wins", () => {
		expect(screenVariants().root({ className: "bg-card" })).toContain("bg-card");
		expect(screenVariants().root({ className: "bg-card" })).not.toContain("bg-background");
	});

	test("lets a caller re-gutter the header", () => {
		const cls = screenVariants().header({ className: "px-8" });
		expect(cls).toContain("px-8");
		expect(cls).not.toContain("px-screen-gutter");
	});
});

describe("resolveScreenEdgePadding", () => {
	const INSETS = { bottom: 34, left: 0, right: 0, top: 59 };
	// A landscape notch, where the horizontal insets are the ones that matter.
	const LANDSCAPE = { bottom: 21, left: 59, right: 59, top: 0 };

	test("insets nothing by default — a container is not safe-area aware unless asked", () => {
		expect(resolveScreenEdgePadding(undefined, INSETS)).toEqual({
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: 0,
		});
		expect(resolveScreenEdgePadding([], INSETS)).toEqual({
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: 0,
		});
	});

	test("pads only the edges it was given", () => {
		expect(resolveScreenEdgePadding(["bottom"], INSETS)).toEqual({
			paddingBottom: 34,
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: 0,
		});
		expect(resolveScreenEdgePadding(["top"], INSETS)).toEqual({
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: 59,
		});
	});

	test("takes each edge's own inset, not one number for all four", () => {
		expect(resolveScreenEdgePadding(SCREEN_EDGES, LANDSCAPE)).toEqual({
			paddingBottom: 21,
			paddingLeft: 59,
			paddingRight: 59,
			paddingTop: 0,
		});
	});

	test("returns 0 rather than undefined for an edge left out", () => {
		// The result is spread over a style, so a hole would punch through
		// whatever it merges onto instead of leaving that padding alone.
		const padding = resolveScreenEdgePadding(["top"], INSETS);
		for (const value of Object.values(padding)) {
			expect(typeof value).toBe("number");
		}
	});

	test("does not care what order the edges are named in", () => {
		expect(resolveScreenEdgePadding(["bottom", "top"], INSETS)).toEqual(
			resolveScreenEdgePadding(["top", "bottom"], INSETS)
		);
	});

	test("pads an edge once even when it is named twice", () => {
		expect(resolveScreenEdgePadding(["top", "top"], INSETS).paddingTop).toBe(59);
	});

	test("covers every edge in SCREEN_EDGES", () => {
		for (const edge of SCREEN_EDGES) {
			const padding = resolveScreenEdgePadding([edge], LANDSCAPE);
			const total = Object.values(padding).reduce((sum, value) => sum + value, 0);
			expect(total).toBe(LANDSCAPE[edge]);
		}
	});
});

/** A closed keyboard over a 34pt inset, with an overlay footer of 58pt content. */
const CLOSED = {
	footerHeight: 58,
	footerPlacement: "overlay",
	keyboardHeight: 0,
	keyboardProgress: 0,
	safeAreaBottom: 34,
} as const;

describe("resolveScrollBottomInset", () => {
	test("reserves what the footer COVERS, not what it measured", () => {
		// The measured height is content only. Reserving that alone leaves the last
		// row sitting behind the footer's own chrome — the bug this replaces.
		const reserve = resolveScrollBottomInset({ ...CLOSED, mode: "standard" });
		expect(reserve).toBe(footerOccupancy(58, 34));
		expect(reserve).toBeGreaterThan(58 + 34);
	});

	test("reserves nothing for a static footer, which took its own space in the flow", () => {
		expect(resolveScrollBottomInset({ ...CLOSED, footerPlacement: "static", mode: "standard" })).toBe(0);
	});

	test("falls back to the bare safe-area band with no footer mounted", () => {
		expect(resolveScrollBottomInset({ ...CLOSED, footerHeight: 0, mode: "standard" })).toBe(34);
	});

	test("never invents a footer's chrome when there is no footer", () => {
		const reserve = resolveScrollBottomInset({ ...CLOSED, footerHeight: 0, mode: "standard" });
		expect(reserve).toBeLessThan(SCREEN_FOOTER_PADDING + SCREEN_FLOATING_BOTTOM_GAP + 34);
	});

	test("adds the keyboard band in standard mode and omits it in keyboard-aware", () => {
		const open = { ...CLOSED, keyboardHeight: -336, keyboardProgress: 1 };
		// `KeyboardAwareScrollView` adds that padding itself; adding it twice
		// leaves a keyboard-sized gap under the content.
		const standard = resolveScrollBottomInset({ ...open, mode: "standard" });
		const aware = resolveScrollBottomInset({ ...open, mode: "keyboard-aware" });
		expect(standard - aware).toBe(336);
	});

	test("fades the safe-area band out as the keyboard covers it", () => {
		const half = resolveScrollBottomInset({ ...CLOSED, keyboardProgress: 0.5, mode: "keyboard-aware" });
		const shut = resolveScrollBottomInset({ ...CLOSED, mode: "keyboard-aware" });
		expect(shut - half).toBe(17);
	});

	test("chat mode adds the composer gap and keeps the full safe-area band", () => {
		// The band is correct in BOTH keyboard states for a chat list — it is real
		// padding while closed and list-lift compensation while open.
		const shut = resolveScrollBottomInset({ ...CLOSED, mode: "chat" });
		const open = resolveScrollBottomInset({ ...CLOSED, keyboardHeight: -336, keyboardProgress: 1, mode: "chat" });
		expect(shut).toBe(footerOccupancy(58, 34) + CHAT_COMPOSER_GAP);
		expect(open).toBe(shut);
	});

	test("chat mode never pads for the keyboard — a chat list is lifted, not padded", () => {
		for (const progress of [0, 0.5, 1]) {
			const reserve = resolveScrollBottomInset({
				...CLOSED,
				keyboardHeight: -336 * progress,
				keyboardProgress: progress,
				mode: "chat",
			});
			expect(reserve).toBe(footerOccupancy(58, 34) + CHAT_COMPOSER_GAP);
		}
	});

	test("returns a non-negative reserve for every mode and placement", () => {
		for (const mode of SCREEN_SCROLL_INSET_MODES) {
			for (const footerPlacement of SCREEN_PLACEMENTS) {
				for (const footerHeight of [0, 58]) {
					const reserve = resolveScrollBottomInset({ ...CLOSED, footerHeight, footerPlacement, mode });
					expect(reserve).toBeGreaterThanOrEqual(0);
				}
			}
		}
	});
});

describe("resolveScreenViewPadding", () => {
	const BASE = {
		footerHeight: 58,
		footerPlacement: "overlay",
		navbarHeight: 96,
		navbarPlacement: "overlay",
		safeAreaBottom: 34,
		safeAreaTop: 59,
	} as const;

	test("clears an overlay navbar by its measured height, safe-area band included", () => {
		expect(resolveScreenViewPadding(BASE).paddingTop).toBe(96);
	});

	test("clears an overlay footer by what it covers, not by what it measured", () => {
		expect(resolveScreenViewPadding(BASE).paddingBottom).toBe(footerOccupancy(58, 34));
	});

	test("adds nothing for static chrome, which took its own space in the flow", () => {
		const padding = resolveScreenViewPadding({
			...BASE,
			footerPlacement: "static",
			navbarPlacement: "static",
		});
		expect(padding).toEqual({ paddingBottom: 0, paddingTop: 0 });
	});

	test("falls back to the raw safe-area inset on an edge with no chrome", () => {
		const padding = resolveScreenViewPadding({ ...BASE, footerHeight: 0, navbarHeight: 0 });
		expect(padding).toEqual({ paddingBottom: 34, paddingTop: 59 });
	});

	test("agrees with a scrollable's reserve on what an overlay footer covers", () => {
		// The two run in different components; a screen that swaps a scroll area
		// for a static body must not shift its content.
		expect(resolveScreenViewPadding(BASE).paddingBottom).toBe(
			resolveScrollBottomInset({ ...CLOSED, mode: "standard" })
		);
	});
});

describe("resolveNavbarBorderOpacity", () => {
	test("draws the hairline at rest when the fade is off", () => {
		// The default. A screen whose content starts flush against the bar wants
		// the line from the first frame — screens used to re-add one by hand
		// precisely because it faded.
		for (const scrollY of [0, 10, 200]) {
			expect(resolveNavbarBorderOpacity(scrollY, false)).toBe(1);
		}
	});

	test("starts invisible at rest when the fade is on", () => {
		expect(resolveNavbarBorderOpacity(0, true)).toBe(0);
	});

	test("reaches full strength by the fade distance", () => {
		expect(resolveNavbarBorderOpacity(SCREEN_BORDER_FADE_DISTANCE, true)).toBe(1);
	});

	test("ramps linearly across the distance", () => {
		expect(resolveNavbarBorderOpacity(SCREEN_BORDER_FADE_DISTANCE / 2, true)).toBe(0.5);
		expect(resolveNavbarBorderOpacity(SCREEN_BORDER_FADE_DISTANCE / 4, true)).toBe(0.25);
	});

	test("clamps past the distance rather than overshooting", () => {
		expect(resolveNavbarBorderOpacity(SCREEN_BORDER_FADE_DISTANCE * 50, true)).toBe(1);
	});

	test("clamps a rubber-banded overscroll, which reports a negative offset", () => {
		// iOS reports a negative contentOffset while the user drags past the top.
		// Unclamped that drives the opacity below zero, which some backends treat
		// as garbage rather than as transparent.
		for (const scrollY of [-1, -80]) {
			expect(resolveNavbarBorderOpacity(scrollY, true)).toBe(0);
		}
	});

	test("never leaves the 0…1 range for any offset", () => {
		for (const scrollY of [-500, -20, 0, 1, 19, 20, 21, 5000]) {
			const opacity = resolveNavbarBorderOpacity(scrollY, true);
			expect(opacity).toBeGreaterThanOrEqual(0);
			expect(opacity).toBeLessThanOrEqual(1);
		}
	});
});

describe("resolveFooterBorderOpacity", () => {
	/** Scrolled to the middle of content twice the viewport's height. */
	const MIDDLE = { contentHeight: 1600, layoutHeight: 800, scrollY: 400 };

	test("draws the hairline at rest when the fade is off", () => {
		expect(resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: false })).toBe(1);
		expect(resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: false, scrollY: 800 })).toBe(1);
	});

	test("reads the FAR end of the scroll, not the near one", () => {
		// The navbar's line asks "is there content above?" and brightens as you
		// leave the top. This one asks "is there content below?", so it is already
		// full at the top and fades as the content runs out — a footer line driven
		// by scrollY would be brightest where there is nothing left to scroll to.
		expect(resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: true, scrollY: 0 })).toBe(1);
		expect(resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: true, scrollY: 800 })).toBe(0);
	});

	test("fades across the last stretch of the scroll", () => {
		const atEnd = 800;
		expect(
			resolveFooterBorderOpacity({
				...MIDDLE,
				fadeOnScroll: true,
				scrollY: atEnd - SCREEN_BORDER_FADE_DISTANCE / 2,
			})
		).toBe(0.5);
	});

	test("clamps a rubber-banded overscroll past the end", () => {
		expect(resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: true, scrollY: 900 })).toBe(0);
	});

	test("draws the hairline while the content is still unmeasured", () => {
		// Both heights are published by the scrollable's own scroll events, so they
		// are 0 until the first one lands. A screen tall enough to scroll does have
		// content below at that point, and one too short never contradicts it.
		expect(resolveFooterBorderOpacity({ contentHeight: 0, fadeOnScroll: true, layoutHeight: 0, scrollY: 0 })).toBe(1);
	});

	test("never leaves the 0…1 range", () => {
		for (const scrollY of [-500, 0, 400, 799, 800, 5000]) {
			const opacity = resolveFooterBorderOpacity({ ...MIDDLE, fadeOnScroll: true, scrollY });
			expect(opacity).toBeGreaterThanOrEqual(0);
			expect(opacity).toBeLessThanOrEqual(1);
		}
	});
});
