import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { OVERLAY_SCRIM_TOKEN } from "../overlay/overlay.variants";
import {
	DRAWER_CLOSE_HIT_SLOP,
	DRAWER_DISMISS_FRACTION,
	DRAWER_EDGES,
	DRAWER_FLING_VELOCITY,
	DRAWER_PAN_ACTIVE_OFFSET,
	DRAWER_RELEASE_MS,
	DRAWER_RUBBER_BAND,
	DRAWER_SCRIM_TOKEN,
	DRAWER_SIDES,
	DRAWER_SIZE_EXTENT,
	DRAWER_SIZES,
	drawerVariants,
	resolveDrawerDrag,
	resolveDrawerDragFraction,
	resolveDrawerEdge,
	resolveDrawerExitDuration,
	resolveDrawerExtent,
	resolveDrawerFrameExtent,
	resolveDrawerInsets,
	resolveDrawerOffset,
	resolveDrawerRelease,
} from "./drawer.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

/** The slots this component declares, pinned so a new one has to be added before the sweeps can miss it. */
const SLOT_NAMES = [
	"scrim",
	"positioner",
	"content",
	"inner",
	"header",
	"heading",
	"body",
	"bodyContent",
	"footer",
	"close",
] as const;

describe("constants", () => {
	test("the sides, edges and sizes are the ones the spec names", () => {
		expect([...DRAWER_SIDES]).toEqual(["start", "end", "top", "bottom"]);
		expect([...DRAWER_EDGES]).toEqual(["left", "right", "top", "bottom"]);
		expect([...DRAWER_SIZES]).toEqual(["sm", "md", "lg", "full"]);
	});

	test("each size is a fraction of the window with a cap, and full is uncapped", () => {
		expect(DRAWER_SIZE_EXTENT).toEqual({
			full: { fraction: 0.94, max: Number.POSITIVE_INFINITY },
			lg: { fraction: 0.88, max: 400 },
			md: { fraction: 0.78, max: 320 },
			sm: { fraction: 0.62, max: 280 },
		});
	});

	test("the release rules: 40% of the extent, or a fling faster than 800 pt/s", () => {
		expect(DRAWER_DISMISS_FRACTION).toBe(0.4);
		expect(DRAWER_FLING_VELOCITY).toBe(800);
		expect(DRAWER_RUBBER_BAND).toBe(40);
	});

	test("the pan waits for real travel before it claims the touch", () => {
		expect(DRAWER_PAN_ACTIVE_OFFSET).toBeGreaterThanOrEqual(8);
		expect(DRAWER_PAN_ACTIVE_OFFSET).toBeLessThanOrEqual(16);
	});

	test("the scrim token is the foundation's", () => {
		expect(DRAWER_SCRIM_TOKEN).toBe(OVERLAY_SCRIM_TOKEN);
	});

	test("the close glyph gets slop toward 44pt", () => {
		expect(DRAWER_CLOSE_HIT_SLOP).toBe(8);
	});

	test("a release animation is finite and ordered", () => {
		expect(DRAWER_RELEASE_MS.min).toBeGreaterThan(0);
		expect(DRAWER_RELEASE_MS.max).toBeGreaterThan(DRAWER_RELEASE_MS.min);
	});
});

describe("resolveDrawerEdge", () => {
	test("start is left and end is right in a left-to-right layout", () => {
		expect(resolveDrawerEdge("start", false)).toBe("left");
		expect(resolveDrawerEdge("end", false)).toBe("right");
	});

	test("start and end swap in a right-to-left layout", () => {
		expect(resolveDrawerEdge("start", true)).toBe("right");
		expect(resolveDrawerEdge("end", true)).toBe("left");
	});

	test("top and bottom do not depend on the direction", () => {
		for (const isRTL of [false, true]) {
			expect(resolveDrawerEdge("top", isRTL)).toBe("top");
			expect(resolveDrawerEdge("bottom", isRTL)).toBe("bottom");
		}
	});
});

describe("resolveDrawerExtent", () => {
	test("a phone takes the fraction of each size", () => {
		// 62%, 78%, 88% of 320 sit under every cap.
		expect(resolveDrawerExtent("sm", 320)).toBe(198);
		expect(resolveDrawerExtent("md", 320)).toBe(250);
		expect(resolveDrawerExtent("lg", 320)).toBe(282);
		expect(resolveDrawerExtent("full", 320)).toBe(301);
	});

	test("a wide window stops at each size's cap, except full", () => {
		expect(resolveDrawerExtent("sm", 1024)).toBe(280);
		expect(resolveDrawerExtent("md", 1024)).toBe(320);
		expect(resolveDrawerExtent("lg", 1024)).toBe(400);
		expect(resolveDrawerExtent("full", 1024)).toBe(963);
	});

	test("a 393pt phone reaches the md cap only just", () => {
		expect(resolveDrawerExtent("md", 393)).toBe(307);
		expect(resolveDrawerExtent("md", 430)).toBe(320);
	});

	test("an unmeasured window is zero, never negative", () => {
		expect(resolveDrawerExtent("md", 0)).toBe(0);
		expect(resolveDrawerExtent("md", -10)).toBe(0);
	});
});

describe("resolveDrawerOffset", () => {
	test("open is no translate on any edge", () => {
		for (const edge of DRAWER_EDGES) {
			const offset = resolveDrawerOffset(edge, 300, 1);
			expect(offset.translateX + 0).toBe(0);
			expect(offset.translateY + 0).toBe(0);
		}
	});

	test("closed is the whole extent off the docked edge", () => {
		expect(resolveDrawerOffset("left", 300, 0)).toEqual({ translateX: -300, translateY: 0 });
		expect(resolveDrawerOffset("right", 300, 0)).toEqual({ translateX: 300, translateY: 0 });
		expect(resolveDrawerOffset("top", 300, 0)).toEqual({ translateX: 0, translateY: -300 });
		expect(resolveDrawerOffset("bottom", 300, 0)).toEqual({ translateX: 0, translateY: 300 });
	});

	test("half way is half the extent", () => {
		expect(resolveDrawerOffset("left", 300, 0.5).translateX).toBe(-150);
		expect(resolveDrawerOffset("bottom", 300, 0.25).translateY).toBe(225);
	});
});

describe("resolveDrawerDrag", () => {
	test("movement toward the docked edge follows the finger one to one", () => {
		expect(resolveDrawerDrag("left", -120)).toBe(-120);
		expect(resolveDrawerDrag("right", 120)).toBe(120);
		expect(resolveDrawerDrag("top", -60)).toBe(-60);
		expect(resolveDrawerDrag("bottom", 60)).toBe(60);
	});

	test("movement away from the edge rubber-bands", () => {
		// 40 / (1 + 40 / 40) = 20.
		expect(resolveDrawerDrag("left", 40)).toBe(20);
		expect(resolveDrawerDrag("right", -40)).toBe(-20);
		expect(resolveDrawerDrag("top", 40)).toBe(20);
		expect(resolveDrawerDrag("bottom", -40)).toBe(-20);
	});

	test("the rubber band never reaches its cap however far the finger goes", () => {
		const far = resolveDrawerDrag("left", 10_000);
		expect(far).toBeGreaterThan(39);
		expect(far).toBeLessThan(DRAWER_RUBBER_BAND);
	});

	test("no movement is no drag", () => {
		expect(resolveDrawerDrag("left", 0) + 0).toBe(0);
	});
});

describe("resolveDrawerDragFraction", () => {
	test("how much of the extent has been dragged toward the edge, 0 to 1", () => {
		expect(resolveDrawerDragFraction("left", -150, 300)).toBe(0.5);
		expect(resolveDrawerDragFraction("right", 75, 300)).toBe(0.25);
		expect(resolveDrawerDragFraction("bottom", 600, 300)).toBe(1);
	});

	test("a drag away from the edge is no fraction", () => {
		expect(resolveDrawerDragFraction("left", 20, 300)).toBe(0);
		expect(resolveDrawerDragFraction("top", 20, 300)).toBe(0);
	});

	test("an unmeasured panel is no fraction", () => {
		expect(resolveDrawerDragFraction("left", -100, 0)).toBe(0);
	});
});

describe("resolveDrawerRelease", () => {
	const extent = 300;

	test("a short, slow drag restores", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: -60, velocity: -100 })).toBe("restore");
	});

	test("past 40% of the extent dismisses", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: -121, velocity: 0 })).toBe("dismiss");
		expect(resolveDrawerRelease({ edge: "right", extent, translation: 121, velocity: 0 })).toBe("dismiss");
		expect(resolveDrawerRelease({ edge: "top", extent, translation: -121, velocity: 0 })).toBe("dismiss");
		expect(resolveDrawerRelease({ edge: "bottom", extent, translation: 121, velocity: 0 })).toBe("dismiss");
	});

	test("just under the threshold restores", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: -119, velocity: 0 })).toBe("restore");
	});

	test("a fling toward the edge dismisses from a short drag", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: -20, velocity: -900 })).toBe("dismiss");
		expect(resolveDrawerRelease({ edge: "bottom", extent, translation: 20, velocity: 900 })).toBe("dismiss");
	});

	test("a fling away from the edge restores, even past the threshold", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: -200, velocity: 900 })).toBe("restore");
		expect(resolveDrawerRelease({ edge: "right", extent, translation: 200, velocity: -900 })).toBe("restore");
	});

	test("a drag away from the edge restores", () => {
		expect(resolveDrawerRelease({ edge: "left", extent, translation: 30, velocity: 0 })).toBe("restore");
	});

	test("an unmeasured panel restores", () => {
		expect(resolveDrawerRelease({ edge: "left", extent: 0, translation: -200, velocity: 0 })).toBe("restore");
	});
});

describe("resolveDrawerExitDuration", () => {
	test("a fast fling covers the rest quickly, but never faster than the floor", () => {
		expect(resolveDrawerExitDuration({ remaining: 100, velocity: 2000 })).toBe(DRAWER_RELEASE_MS.min);
	});

	test("the remaining distance at the release velocity", () => {
		expect(resolveDrawerExitDuration({ remaining: 150, velocity: 1000 })).toBe(150);
	});

	test("accepts the velocity's sign either way", () => {
		expect(resolveDrawerExitDuration({ remaining: 150, velocity: -1000 })).toBe(150);
	});

	test("a slow release takes the ceiling, never longer", () => {
		expect(resolveDrawerExitDuration({ remaining: 200, velocity: 0 })).toBe(DRAWER_RELEASE_MS.max);
		expect(resolveDrawerExitDuration({ remaining: 200, velocity: 50 })).toBe(DRAWER_RELEASE_MS.max);
	});

	test("nothing left to cover is the floor", () => {
		expect(resolveDrawerExitDuration({ remaining: 0, velocity: 500 })).toBe(DRAWER_RELEASE_MS.min);
	});
});

describe("resolveDrawerInsets", () => {
	const insets = { bottom: 34, left: 3, right: 5, top: 59 };

	test("a left drawer pads the three sides that meet the screen, not the one facing the app", () => {
		expect(resolveDrawerInsets("left", insets)).toEqual({ bottom: 34, left: 3, right: 0, top: 59 });
	});

	test("a right drawer", () => {
		expect(resolveDrawerInsets("right", insets)).toEqual({ bottom: 34, left: 0, right: 5, top: 59 });
	});

	test("a top drawer clears the status bar, not the home indicator", () => {
		expect(resolveDrawerInsets("top", insets)).toEqual({ bottom: 0, left: 3, right: 5, top: 59 });
	});

	test("a bottom drawer clears the home indicator, not the status bar", () => {
		expect(resolveDrawerInsets("bottom", insets)).toEqual({ bottom: 34, left: 3, right: 5, top: 0 });
	});
});

describe("resolveDrawerFrameExtent", () => {
	const insets = { bottom: 34, left: 0, right: 0, top: 62 };

	test("the docked edge's inset is added, so the size measures the content, not the status bar", () => {
		expect(resolveDrawerFrameExtent("top", 280, insets)).toBe(342);
		expect(resolveDrawerFrameExtent("bottom", 280, insets)).toBe(314);
	});

	test("a side drawer in portrait has no inset on its docked edge", () => {
		expect(resolveDrawerFrameExtent("left", 320, insets)).toBe(320);
		expect(resolveDrawerFrameExtent("right", 320, { ...insets, right: 47 })).toBe(367);
	});
});

describe("drawerVariants", () => {
	test("the panel is a popover surface", () => {
		expect(drawerVariants().content()).toContain("bg-popover");
		expect(drawerVariants().content()).toContain("absolute");
	});

	test("defaults to the left edge", () => {
		expect(drawerVariants().content()).toContain("left-0");
	});

	test("each edge docks to its side and rounds only the free corners", () => {
		const left = drawerVariants({ edge: "left" }).content();
		expect(left).toContain("left-0");
		expect(left).toContain("inset-y-0");
		expect(left).toContain("rounded-r-lg");
		expect(left).not.toMatch(/rounded-(l|t|b)-/);

		const right = drawerVariants({ edge: "right" }).content();
		expect(right).toContain("right-0");
		expect(right).toContain("inset-y-0");
		expect(right).toContain("rounded-l-lg");
		expect(right).not.toMatch(/rounded-(r|t|b)-/);

		const top = drawerVariants({ edge: "top" }).content();
		expect(top).toContain("top-0");
		expect(top).toContain("inset-x-0");
		expect(top).toContain("rounded-b-lg");
		expect(top).not.toMatch(/rounded-(l|r|t)-/);

		const bottom = drawerVariants({ edge: "bottom" }).content();
		expect(bottom).toContain("bottom-0");
		expect(bottom).toContain("inset-x-0");
		expect(bottom).toContain("rounded-t-lg");
		expect(bottom).not.toMatch(/rounded-(l|r|b)-/);
	});

	test("a caller's className reaches the panel and wins a conflict", () => {
		const content = drawerVariants().content({ className: "bg-card" });
		expect(content).toContain("bg-card");
		expect(content).not.toContain("bg-popover");
	});

	test("the positioner fills the window the panel is placed in", () => {
		expect(drawerVariants().positioner()).toBe("absolute inset-0");
	});

	test("the scrim paints the foundation's token", () => {
		expect(drawerVariants().scrim()).toContain(`bg-${DRAWER_SCRIM_TOKEN}`);
	});

	test("the header is a row with the heading taking the slack", () => {
		expect(drawerVariants().header()).toContain("flex-row");
		expect(drawerVariants().heading()).toContain("flex-1");
	});

	test("the footer sits under a hairline", () => {
		const footer = drawerVariants().footer();
		expect(footer).toContain("border-t");
		expect(footer).toContain("border-border");
	});

	test("the footer pins to the panel's end even with no body above it", () => {
		expect(drawerVariants().footer()).toContain("mt-auto");
	});

	test("the body takes the panel's remaining height", () => {
		expect(drawerVariants().body()).toContain("flex-1");
	});
});

describe("every token the slots name", () => {
	test("is declared in both variants of theme.css", () => {
		for (const edge of DRAWER_EDGES) {
			const slots = drawerVariants({ edge });
			for (const name of SLOT_NAMES) {
				for (const token of colorTokens(slots[name]() ?? "")) {
					expect({ inLight: LIGHT.has(token), slot: name, token }).toEqual({ inLight: true, slot: name, token });
					expect({ inDark: DARK.has(token), slot: name, token }).toEqual({ inDark: true, slot: name, token });
				}
			}
		}
	});

	test("the reader found tokens at all", () => {
		expect(colorTokens(drawerVariants().content())).toContain("popover");
		expect(colorTokens(drawerVariants().footer())).toContain("border");
	});
});
