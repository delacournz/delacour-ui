import { describe, expect, test } from "bun:test";
import { resolveSheetBottomInset, resolveSheetScrollEndPadding } from "@delacour/react-native-bottom-sheet/core";
import { declaredTokens, tokenValue } from "../../styles/theme-tokens.test";
import {
	BOTTOM_SHEET_BACKDROP_INDICES,
	BOTTOM_SHEET_CLOSE_HIT_SLOP,
	BOTTOM_SHEET_FOOTER_GAP,
	BOTTOM_SHEET_FOOTER_PADDING,
	BOTTOM_SHEET_OVERLAY_OPACITY,
	BOTTOM_SHEET_OVERLAY_TOKEN,
	bottomSheetVariants,
} from "./bottom-sheet.variants";

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

const SLOTS = bottomSheetVariants();
const DETACHED = bottomSheetVariants({ detached: true });

/**
 * The slots this component declares, pinned rather than derived.
 *
 * `tv` adds a `base` slot of its own that emits nothing, so iterating the
 * returned object sweeps one entry that is not ours. Listing them also means a
 * new slot has to be added here before the checks below can miss it.
 */
const SLOT_NAMES = [
	"overlay",
	"background",
	"handle",
	"handleIndicator",
	"content",
	"scrollContent",
	"steps",
	"step",
	"footer",
	"stickyFooter",
	"close",
	"title",
] as const;

describe("the theme.css reader", () => {
	// The token assertions below are only worth anything if the parse found something.
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("the overlay token", () => {
	test("is declared in both variants", () => {
		expect(LIGHT.has(BOTTOM_SHEET_OVERLAY_TOKEN)).toBe(true);
		expect(DARK.has(BOTTOM_SHEET_OVERLAY_TOKEN)).toBe(true);
	});

	test("is the token the overlay slot actually paints", () => {
		expect(SLOTS.overlay()).toContain(`bg-${BOTTOM_SHEET_OVERLAY_TOKEN}`);
	});

	test("carries its own alpha in both variants, which is what makes the opacity 1", () => {
		for (const variant of ["light", "dark"] as const) {
			const value = tokenValue(variant, BOTTOM_SHEET_OVERLAY_TOKEN);
			if (value === undefined) throw new Error(`theme.css declares no --overlay under ${variant}`);

			const alpha = Number(value.match(/\/\s*([\d.]+)%\s*\)/)?.[1]) / 100;
			expect(alpha).toBeGreaterThan(0);
			expect(alpha).toBeLessThan(1);
		}

		// Any other opacity would multiply against that alpha and land the scrim
		// somewhere the theme did not ask for.
		expect(BOTTOM_SHEET_OVERLAY_OPACITY).toBe(1);
	});

	test("the two variants differ — a black scrim over a near-black theme is invisible", () => {
		const light = tokenValue("light", BOTTOM_SHEET_OVERLAY_TOKEN);
		const dark = tokenValue("dark", BOTTOM_SHEET_OVERLAY_TOKEN);
		expect(light).not.toBe(dark);
	});
});

describe("every token the slots name", () => {
	test("is declared in both variants of theme.css", () => {
		for (const name of SLOT_NAMES) {
			for (const token of colorTokens(SLOTS[name]())) {
				expect({ inLight: LIGHT.has(token), slot: name, token }).toEqual({ inLight: true, slot: name, token });
				expect({ inDark: DARK.has(token), slot: name, token }).toEqual({ inDark: true, slot: name, token });
			}
		}
	});

	test("the reader found tokens at all", () => {
		// Every assertion above passes vacuously if the extractor matches nothing.
		expect(colorTokens(SLOTS.stickyFooter())).toEqual(expect.arrayContaining(["popover", "border"]));
		expect(colorTokens(SLOTS.handleIndicator())).toContain("muted-foreground");
	});
});

describe("the backdrop indices", () => {
	test("show the scrim from the first snap point and hide it only when closed", () => {
		// A modal sheet has no resting state: presented or gone.
		expect(BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex).toBe(0);
		expect(BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex).toBe(-1);
		expect(BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex).toBeLessThan(BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex);
	});
});

describe("the inset helpers the engine's core exports", () => {
	// They used to live here. They moved to the engine so the engine's own footer
	// and body could share them; the skin re-exports them for the callers that
	// imported them from `@delacour/react-native-ui/bottom-sheet`.
	test("give the safe-area band to static content when nothing is pinned below it", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: false })).toBe(34);
	});

	test("hold content off a pinned footer by the gap alone, never the band", () => {
		// The footer's own box carries the band; the content asking for it too
		// would count it twice.
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: true })).toBe(0);
		expect(
			resolveSheetScrollEndPadding({ bottom: 34, footerGap: BOTTOM_SHEET_FOOTER_GAP, hasStickyFooter: true })
		).toBe(BOTTOM_SHEET_FOOTER_GAP);
	});
});

describe("bottomSheetVariants slots", () => {
	test("the title slot carries layout only, never type", () => {
		// The type comes from the `Text.Header` the part renders. A `text-lg` here
		// would be a second definition of that preset which can drift from it.
		expect(SLOTS.title()).not.toMatch(/\btext-\w/);
		expect(SLOTS.title()).not.toMatch(/\bfont-\w/);
	});

	test("the title reserves room for the close control on every sheet", () => {
		// Reserved unconditionally, the way `Badge` reserves its border on every
		// variant: conditional clearance reflows the title the moment one is added.
		expect(SLOTS.title()).toMatch(/\bpr-[\d.]+\b/);
	});

	test("every slot emits something, so none of them is untestable", () => {
		// `tv` returns undefined for an empty class string, and a slot that says
		// nothing is a slot no assertion here can reach.
		for (const name of SLOT_NAMES) {
			expect({ emits: typeof SLOTS[name](), name }).toEqual({ emits: "string", name });
		}
	});

	test("declares no slot the pinned list has not seen", () => {
		// `base` is tv's own, and is the one entry that is not ours.
		const declared = Object.keys(SLOTS).filter((name) => name !== "base");
		expect(declared.sort()).toEqual([...SLOT_NAMES].sort());
	});

	test("an attached sheet's surface rounds its top corners only", () => {
		const background = SLOTS.background();
		expect(background).toMatch(/\brounded-t-/);
		expect(background).not.toMatch(/\brounded-b-/);
		// A bare `rounded-*` would round the bottom edge too, and that edge runs off
		// the screen — the radius shows as two notches of the app behind it.
		expect(background).not.toMatch(/\brounded-(?:none|xs|sm|md|lg|xl|2xl|3xl|full)\b/);
	});

	test("a detached card's surface rounds every corner, and only once", () => {
		const background = DETACHED.background();
		// The card floats, so its bottom edge is on screen and needs the radius.
		expect(background).toMatch(/\brounded-2xl\b/);
		// tailwind-merge has to have replaced the top-only radius, not stacked
		// beside it — two radius utilities on one view is order-dependent.
		expect(background).not.toMatch(/\brounded-t-/);
		// The surface itself is unchanged.
		expect(colorTokens(background)).toEqual(colorTokens(SLOTS.background()));
	});

	test("a pinned footer brings a surface and a line where an inline one does not", () => {
		// It draws OVER the content, so without them the content scrolls straight
		// through it. An inline footer is in the flow and needs neither.
		expect(SLOTS.stickyFooter()).toMatch(/\bbg-\w/);
		expect(SLOTS.stickyFooter()).toMatch(/\bborder-t\b/);
		expect(SLOTS.footer()).not.toMatch(/\bbg-\w/);
		expect(SLOTS.footer()).not.toMatch(/\bborder-t\b/);
	});

	test("a pinned footer writes its vertical padding as the engine's prop, never a class", () => {
		// The engine measures the footer's inner box into the sheet's height, and
		// padding handed to its `padding` prop lands on that box. A class on the
		// outer view would be height the snap point never counts.
		expect(SLOTS.stickyFooter()).not.toMatch(/\bp[tby]?-[\d.]+\b/);
		expect(BOTTOM_SHEET_FOOTER_PADDING).toBeGreaterThan(0);
	});

	test("the content is held off a pinned footer by a real gap", () => {
		// Without it the last row sits flush against the footer's hairline, which
		// reads as content clipped rather than content ended.
		expect(BOTTOM_SHEET_FOOTER_GAP).toBeGreaterThan(0);
	});

	test("both footers share their gutter and gap, so pinning one moves nothing sideways", () => {
		const gutter = /\bpx-screen-gutter\b/;
		expect(SLOTS.footer()).toMatch(gutter);
		expect(SLOTS.stickyFooter()).toMatch(gutter);
		expect(SLOTS.footer().match(/\bgap-[\d.]+\b/)?.[0]).toBe(SLOTS.stickyFooter().match(/\bgap-[\d.]+\b/)?.[0]);
	});

	test("scrolling content sits on the same gutter as static content", () => {
		// A sheet should not shift sideways because its body became scrollable.
		expect(SLOTS.content()).toMatch(/\bpx-screen-gutter\b/);
		expect(SLOTS.scrollContent()).toMatch(/\bpx-screen-gutter\b/);
	});

	test("a multi-step body keeps the gutter on the stack and the vertical padding on each step", () => {
		// The engine measures each `Step`, not the box around the stack, so
		// vertical padding on `steps` would be height the sheet never counts.
		expect(SLOTS.steps()).toMatch(/\bpx-screen-gutter\b/);
		expect(SLOTS.steps()).not.toMatch(/\bp[tby]-[\d.]+\b/);
		expect(SLOTS.step()).not.toMatch(/\bpx-/);
		// A step reads like static content: same gap, same top padding.
		expect(SLOTS.step().match(/\bgap-[\d.]+\b/)?.[0]).toBe(SLOTS.content().match(/\bgap-[\d.]+\b/)?.[0]);
		expect(SLOTS.step().match(/\bpt-[\d.]+\b/)?.[0]).toBe(SLOTS.content().match(/\bpt-[\d.]+\b/)?.[0]);
	});

	test("the overlay sets no opacity of its own", () => {
		// The engine animates the scrim's opacity off the sheet's index; a class
		// here would be a second writer of the same style property.
		expect(SLOTS.overlay()).not.toMatch(/\bopacity-\d/);
	});

	test("the close control is positioned out of the content flow", () => {
		expect(SLOTS.close()).toContain("absolute");
		expect(BOTTOM_SHEET_CLOSE_HIT_SLOP).toBeGreaterThan(0);
	});

	test("the grabber is a pill with both dimensions set", () => {
		const indicator = SLOTS.handleIndicator();
		expect(indicator).toMatch(/\bh-[\d.]+\b/);
		expect(indicator).toMatch(/\bw-[\d.]+\b/);
		expect(indicator).toContain("rounded-full");
	});
});
