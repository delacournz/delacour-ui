import { describe, expect, test } from "bun:test";
import { declaredTokens, RADIUS_BASE_PX } from "../../styles/theme-tokens.test";
import { OVERLAY_SCRIM_TOKEN } from "../overlay/overlay.variants";
import {
	POPOVER_ARROW_INSET,
	POPOVER_ARROW_SIZE,
	POPOVER_CLOSE_HIT_SLOP,
	POPOVER_COLLISION_PADDING,
	POPOVER_DEFAULTS,
	POPOVER_ENTER_DISTANCE,
	POPOVER_ENTER_SCALE,
	popoverVariants,
} from "./popover.variants";

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
const SLOT_NAMES = ["scrim", "dismissLayer", "content", "arrow", "title", "description", "close"] as const;

const SLOTS = popoverVariants();
const UNSTYLED = popoverVariants({ isUnstyled: true });

describe("popoverVariants — slots", () => {
	test("declares every slot", () => {
		for (const name of SLOT_NAMES) expect(typeof SLOTS[name]).toBe("function");
	});

	test("every token a slot paints with exists in both themes", () => {
		for (const name of SLOT_NAMES) {
			for (const token of colorTokens(SLOTS[name]() ?? "")) {
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});

	test("the scrim is the foundation's token", () => {
		expect(SLOTS.scrim()).toContain(`bg-${OVERLAY_SCRIM_TOKEN}`);
	});

	test("the dismiss layer fills the screen and paints nothing", () => {
		const layer = SLOTS.dismissLayer();
		expect(layer).toContain("absolute");
		expect(layer).toContain("inset-0");
		expect(colorTokens(layer)).toEqual([]);
	});

	test("the panel is a popover surface with a hairline, a card corner, padding and a gap", () => {
		const content = SLOTS.content();
		expect(content).toContain("bg-popover");
		expect(content).toContain("border");
		expect(content).toContain("border-border");
		expect(content).toContain("rounded-lg");
		expect(content).toMatch(/\bp-\d/);
		expect(content).toMatch(/\bgap-\d/);
	});

	test("the arrow is the panel's fill with the panel's border on two edges", () => {
		const arrow = SLOTS.arrow();
		expect(arrow).toContain("bg-popover");
		expect(arrow).toContain("border-border");
		expect(arrow).toContain("border-b");
		expect(arrow).toContain("border-r");
	});

	test("the title reserves room for the close control and sets no type of its own", () => {
		const title = SLOTS.title();
		expect(title).toContain("pr-6");
		expect(title).not.toMatch(/\btext-(xs|sm|base|lg|xl)\b/);
		expect(title).not.toMatch(/\bfont-/);
	});

	test("the close control sits in the corner, out of the flow", () => {
		expect(SLOTS.close()).toContain("absolute");
	});

	test("a caller's className wins on the panel", () => {
		expect(SLOTS.content({ className: "p-6" })).toContain("p-6");
		expect(SLOTS.content({ className: "p-6" })).not.toMatch(/\bp-3\b/);
	});
});

describe("popoverVariants — isUnstyled", () => {
	test("strips the surface, the border, the corner and the padding", () => {
		const content = UNSTYLED.content();
		expect(content).not.toContain("bg-popover");
		expect(content).not.toMatch(/\bborder\b/);
		expect(content).not.toContain("rounded-lg");
		expect(content).not.toMatch(/\bp-\d/);
	});

	test("strips the arrow's paint too", () => {
		expect(UNSTYLED.arrow()).not.toContain("bg-popover");
	});
});

describe("constants", () => {
	test("the arrow never sits inside the panel's rounded corner", () => {
		expect(POPOVER_ARROW_INSET).toBeGreaterThanOrEqual(RADIUS_BASE_PX + (POPOVER_ARROW_SIZE * Math.SQRT2) / 2);
	});

	test("defaults match the documented API", () => {
		expect(POPOVER_DEFAULTS).toEqual({
			placement: "bottom",
			align: "center",
			offset: 8,
			alignOffset: 0,
			width: "content-fit",
		});
		expect(POPOVER_COLLISION_PADDING).toBe(8);
	});

	test("the entrance is a short slide and a slight scale", () => {
		expect(POPOVER_ENTER_DISTANCE).toBe(6);
		expect(POPOVER_ENTER_SCALE).toBe(0.96);
	});

	test("the close glyph has slop to reach a 44pt target", () => {
		expect(POPOVER_CLOSE_HIT_SLOP).toBeGreaterThan(0);
	});
});
