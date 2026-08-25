import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	BOTTOM_SHEET_BACKDROP_INDICES,
	BOTTOM_SHEET_CLOSE_HIT_SLOP,
	BOTTOM_SHEET_FOOTER_GAP,
	BOTTOM_SHEET_FOOTER_PADDING,
	BOTTOM_SHEET_KEYBOARD_DEFAULTS,
	BOTTOM_SHEET_OVERLAY_OPACITY,
	BOTTOM_SHEET_OVERLAY_TOKEN,
	bottomSheetVariants,
	resolveFooterPlacement,
	resolveSheetBottomInset,
} from "./bottom-sheet.variants";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** The body of one `@variant` block, so a token can be read per theme. */
function themeBlock(variant: "light" | "dark"): string {
	return THEME_CSS.split(`@variant ${variant} {`)[1]?.split("}")[0] ?? "";
}

/**
 * Every `--color-*` name declared under one `@variant` block.
 *
 * The reader `badge.variants.test.ts` and `checkbox.variants.test.ts` already
 * use. A token a slot names but a variant does not declare resolves to nothing,
 * so the sheet is drawn in whatever the fallback happens to be — silent, and
 * visible in one theme only.
 */
function declaredColors(variant: "light" | "dark"): Set<string> {
	const names = new Set<string>();

	for (const [, name] of themeBlock(variant).matchAll(/--color-([\w-]+):/g)) {
		names.add(name);
	}

	return names;
}

const LIGHT = declaredColors("light");
const DARK = declaredColors("dark");

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
			const value = themeBlock(variant).match(/--color-overlay:\s*([^;]+);/)?.[1];
			if (value === undefined) throw new Error(`theme.css declares no --color-overlay under ${variant}`);

			const alpha = Number(value.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/)?.[1]);
			expect(alpha).toBeGreaterThan(0);
			expect(alpha).toBeLessThan(1);
		}

		// Leaving gorhom's 0.5 in place would multiply against that alpha and land
		// the scrim at roughly a fifth of what the theme asked for.
		expect(BOTTOM_SHEET_OVERLAY_OPACITY).toBe(1);
	});

	test("the two variants differ — a black scrim over a near-black theme is invisible", () => {
		const light = themeBlock("light").match(/--color-overlay:\s*([^;]+);/)?.[1];
		const dark = themeBlock("dark").match(/--color-overlay:\s*([^;]+);/)?.[1];
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
		// gorhom's own defaults (1 / 0) suit a persistent sheet resting collapsed
		// on screen. A modal sheet has no resting state.
		expect(BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex).toBe(0);
		expect(BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex).toBe(-1);
		expect(BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex).toBeLessThan(BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex);
	});
});

describe("the keyboard defaults", () => {
	test("follow the keyboard, restore on blur, and resize the Android window", () => {
		expect(BOTTOM_SHEET_KEYBOARD_DEFAULTS).toEqual({
			keyboardBehavior: "interactive",
			keyboardBlurBehavior: "restore",
			android_keyboardInputMode: "adjustResize",
		});
	});

	test("does not leave Android on gorhom's adjustPan", () => {
		// `adjustPan` slides the whole window up instead of resizing it, which puts
		// a sheet's footer off-screen. `resize` is what Expo configures and what
		// `KeyboardProvider` requires, so this is the value that matches reality.
		expect(BOTTOM_SHEET_KEYBOARD_DEFAULTS.android_keyboardInputMode).not.toBe("adjustPan");
	});
});

describe("resolveFooterPlacement", () => {
	const footer = (isSticky: boolean) => ({ isFooter: true, isSticky });
	const other = { isFooter: false, isSticky: false };

	test("reports none for children holding no footer", () => {
		expect(resolveFooterPlacement([])).toBe("none");
		expect(resolveFooterPlacement([other, other])).toBe("none");
	});

	test("reports inline for a footer that did not ask to be pinned", () => {
		expect(resolveFooterPlacement([other, footer(false)])).toBe("inline");
	});

	test("reports sticky for one that did, wherever it sits", () => {
		expect(resolveFooterPlacement([footer(true), other])).toBe("sticky");
		expect(resolveFooterPlacement([other, footer(true)])).toBe("sticky");
	});

	test("lets a single sticky footer win over an inline one", () => {
		// Two footers is not a state worth expressing, and the pinned one is the
		// one a caller meant.
		expect(resolveFooterPlacement([footer(false), footer(true)])).toBe("sticky");
		expect(resolveFooterPlacement([footer(true), footer(false)])).toBe("sticky");
	});

	test("never reads a sticky flag off a child that is not a footer", () => {
		expect(resolveFooterPlacement([{ isFooter: false, isSticky: true }])).toBe("none");
	});
});

describe("resolveSheetBottomInset", () => {
	test("gives the safe-area band to the content when nothing is pinned below it", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: false })).toBe(34);
	});

	test("withholds it once a pinned footer's own box is carrying it", () => {
		// gorhom adds the footer's whole measured height — band included — to the
		// content's reserve, so asking for it here too counts it twice.
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: true })).toBe(0);
	});

	test("is a no-op on a device with no bottom inset", () => {
		expect(resolveSheetBottomInset({ bottom: 0, hasStickyFooter: false })).toBe(0);
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

	test("the sheet's surface rounds its top corners only", () => {
		const background = SLOTS.background();
		expect(background).toMatch(/\brounded-t-/);
		expect(background).not.toMatch(/\brounded-b-/);
		// A bare `rounded-*` would round the bottom edge too, and that edge runs off
		// the screen — the radius shows as two notches of the app behind it.
		expect(background).not.toMatch(/\brounded-(?:none|xs|sm|md|lg|xl|2xl|3xl|full)\b/);
	});

	test("a pinned footer brings a surface and a line where an inline one does not", () => {
		// It draws OVER the content, so without them the content scrolls straight
		// through it. An inline footer is in the flow and needs neither.
		expect(SLOTS.stickyFooter()).toMatch(/\bbg-\w/);
		expect(SLOTS.stickyFooter()).toMatch(/\bborder-t\b/);
		expect(SLOTS.footer()).not.toMatch(/\bbg-\w/);
		expect(SLOTS.footer()).not.toMatch(/\bborder-t\b/);
	});

	test("a pinned footer writes its vertical padding as a style, never a class", () => {
		// The bottom padding is animated — the safe-area band collapses into it as
		// the keyboard arrives — and a class cannot carry an animated value. The
		// top is written the same way so the two cannot drift.
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

	test("the overlay sets no opacity of its own", () => {
		// gorhom animates the scrim's opacity off the sheet's position; a class here
		// would be a second writer of the same style property.
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
