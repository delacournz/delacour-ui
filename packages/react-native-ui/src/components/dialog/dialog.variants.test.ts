import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	DIALOG_CLOSE_HIT_SLOP,
	DIALOG_ENTER_SCALE,
	DIALOG_ENTER_TRANSLATE_Y,
	DIALOG_FOOTER_VARIANTS,
	DIALOG_KEYBOARD_MARGIN,
	DIALOG_SCRIM_TOKEN,
	DIALOG_SIZE_CLASS,
	DIALOG_SIZES,
	dialogVariants,
	resolveDialogFooterDirection,
	resolveDialogKeyboardLift,
	resolveDialogRole,
} from "./dialog.variants";

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

/**
 * The slots this component declares, pinned rather than derived — `tv` adds a
 * `base` slot of its own, and a new slot has to be listed here before the
 * token sweep can miss it.
 */
const SLOT_NAMES = ["scrim", "positioner", "content", "close", "header", "title", "body", "footer"] as const;

describe("dialogVariants", () => {
	test("the scrim paints the overlay token, which exists in both themes", () => {
		expect(dialogVariants().scrim()).toContain(`bg-${DIALOG_SCRIM_TOKEN}`);
		expect(LIGHT.has(DIALOG_SCRIM_TOKEN)).toBe(true);
		expect(DARK.has(DIALOG_SCRIM_TOKEN)).toBe(true);
	});

	test("the positioner fills the window, centres the card and keeps the screen gutter", () => {
		const positioner = dialogVariants().positioner();
		expect(positioner).toContain("absolute");
		expect(positioner).toContain("inset-0");
		expect(positioner).toContain("items-center");
		expect(positioner).toContain("justify-center");
		expect(positioner).toContain("px-screen-gutter");
	});

	test("the card is a popover surface with the card corner and a hairline", () => {
		const content = dialogVariants().content();
		expect(content).toContain("bg-popover");
		expect(content).toContain("rounded-lg");
		expect(content).toContain("border");
		expect(content).toContain("border-border");
		expect(content).toContain("w-full");
	});

	test("each size pins its own max width", () => {
		expect(DIALOG_SIZE_CLASS).toEqual({
			full: "max-w-full",
			lg: "max-w-[520px]",
			md: "max-w-[400px]",
			sm: "max-w-[320px]",
		});
		for (const size of DIALOG_SIZES) {
			expect(dialogVariants({ size }).content()).toContain(DIALOG_SIZE_CLASS[size]);
		}
	});

	test("defaults to md", () => {
		expect(dialogVariants().content()).toContain(DIALOG_SIZE_CLASS.md);
	});

	test("a caller's className reaches the card and wins a conflict", () => {
		const content = dialogVariants().content({ className: "rounded-2xl" });
		expect(content).toContain("rounded-2xl");
		expect(content).not.toContain("rounded-lg");
	});

	test("the title reserves clearance for the close glyph and carries no type of its own", () => {
		const title = dialogVariants().title();
		expect(title).toBe("pr-8");
		expect(title).not.toMatch(/\btext-(xs|sm|base|lg|xl|\dxl)\b/);
		expect(title).not.toMatch(/\bfont-/);
	});

	test("the close glyph sits in the card's top-right corner", () => {
		const close = dialogVariants().close();
		expect(close).toContain("absolute");
		expect(close).toContain("top-");
		expect(close).toContain("right-");
	});

	test("a plain footer is a right-aligned row inside the card padding", () => {
		const footer = dialogVariants({ footer: "plain" }).footer();
		expect(footer).toContain("flex-row");
		expect(footer).toContain("justify-end");
		expect(footer).toContain("gap-2");
		expect(footer).not.toContain("bg-muted");
	});

	test("a panel footer bleeds to the card's edges on a muted band under a hairline", () => {
		const footer = dialogVariants({ footer: "panel" }).footer();
		expect(footer).toContain("bg-muted");
		expect(footer).toContain("border-t");
		expect(footer).toContain("border-border");
		expect(footer).toMatch(/-mx-\d/);
		expect(footer).toMatch(/-mb-\d/);
		expect(footer).toContain("rounded-b-lg");
	});

	test("a column footer stacks its actions full width", () => {
		const footer = dialogVariants({ footer: "plain", footerDirection: "column" }).footer();
		expect(footer).toContain("flex-col");
		expect(footer).not.toContain("flex-row");
	});

	test("the footer variants are the two the spec names", () => {
		expect([...DIALOG_FOOTER_VARIANTS]).toEqual(["plain", "panel"]);
	});
});

describe("every token the slots name", () => {
	test("is declared in both variants of theme.css", () => {
		for (const size of DIALOG_SIZES) {
			for (const footer of DIALOG_FOOTER_VARIANTS) {
				const slots = dialogVariants({ footer, size });
				for (const name of SLOT_NAMES) {
					for (const token of colorTokens(slots[name]())) {
						expect({ inLight: LIGHT.has(token), slot: name, token }).toEqual({ inLight: true, slot: name, token });
						expect({ inDark: DARK.has(token), slot: name, token }).toEqual({ inDark: true, slot: name, token });
					}
				}
			}
		}
	});

	test("the reader found tokens at all", () => {
		expect(colorTokens(dialogVariants().content())).toEqual(expect.arrayContaining(["popover", "border"]));
		expect(colorTokens(dialogVariants({ footer: "panel" }).footer())).toEqual(
			expect.arrayContaining(["muted", "border"])
		);
	});
});

describe("resolveDialogFooterDirection", () => {
	test("stacks on the narrow card only", () => {
		expect(resolveDialogFooterDirection("sm")).toBe("column");
		expect(resolveDialogFooterDirection("md")).toBe("row");
		expect(resolveDialogFooterDirection("lg")).toBe("row");
		expect(resolveDialogFooterDirection("full")).toBe("row");
	});
});

describe("resolveDialogRole", () => {
	test("a dismissible dialog is a dialog, a non-dismissible one an alert dialog", () => {
		expect(resolveDialogRole(true)).toBe("dialog");
		expect(resolveDialogRole(false)).toBe("alertdialog");
	});
});

describe("motion constants", () => {
	test("the card grows into place from just under full size and just below", () => {
		expect(DIALOG_ENTER_SCALE).toBe(0.96);
		expect(DIALOG_ENTER_TRANSLATE_Y).toBe(8);
	});
});

describe("DIALOG_CLOSE_HIT_SLOP", () => {
	test("brings a bare corner glyph up toward the 44pt minimum", () => {
		expect(DIALOG_CLOSE_HIT_SLOP).toBe(8);
	});
});

describe("resolveDialogKeyboardLift", () => {
	const base = { cardBottom: 500, cardTop: 300, margin: DIALOG_KEYBOARD_MARGIN, topInset: 59, windowHeight: 852 };

	test("the margin is 16", () => {
		expect(DIALOG_KEYBOARD_MARGIN).toBe(16);
	});

	test("no keyboard, no lift", () => {
		expect(resolveDialogKeyboardLift({ ...base, keyboardHeight: 0 })).toBe(0);
	});

	test("a keyboard that stays below the card and its margin does not lift it", () => {
		// The keyboard's top is at 852 - 300 = 552, clear of 500 + 16.
		expect(resolveDialogKeyboardLift({ ...base, keyboardHeight: 300 })).toBe(0);
	});

	test("a keyboard overlapping the card lifts it just clear, plus the margin", () => {
		// The keyboard's top is at 852 - 400 = 452; the card's bottom needs to be at 436.
		expect(resolveDialogKeyboardLift({ ...base, keyboardHeight: 400 })).toBe(64);
	});

	test("accepts the keyboard controller's negative height", () => {
		expect(resolveDialogKeyboardLift({ ...base, keyboardHeight: -400 })).toBe(64);
	});

	test("never pushes the card's top under the top safe-area inset", () => {
		// The card would need 500 + 16 - (852 - 700) = 364, but its top can rise only 300 - 59.
		expect(resolveDialogKeyboardLift({ ...base, keyboardHeight: 700 })).toBe(241);
	});

	test("never negative, even for a card already above the inset", () => {
		expect(resolveDialogKeyboardLift({ ...base, cardTop: 20, keyboardHeight: 700 })).toBe(0);
	});

	test("an unmeasured card is not lifted", () => {
		expect(
			resolveDialogKeyboardLift({ ...base, cardBottom: 0, cardTop: 0, keyboardHeight: 400, windowHeight: 852 })
		).toBe(0);
	});
});
