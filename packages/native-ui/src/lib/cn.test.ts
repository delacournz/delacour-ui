import { describe, expect, test } from "bun:test";
import {
	BUTTON_SIZE_TOKENS,
	BUTTON_TEXT_TOKENS,
	ICON_SIZE_TOKENS,
	INPUT_SIZE_TOKENS,
	INPUT_TEXT_TOKENS,
	SCREEN_SIZE_TOKENS,
} from "../styles/tokens";
import { cn } from "./cn";

describe("cn", () => {
	test("joins plain class strings", () => {
		expect(cn("px-2", "py-1")).toBe("px-2 py-1");
	});

	test("drops falsy values", () => {
		expect(cn("px-2", false, null, undefined, "", "py-1")).toBe("px-2 py-1");
	});

	test("resolves conditional objects and arrays", () => {
		expect(cn(["px-2", { "py-1": true, "py-4": false }])).toBe("px-2 py-1");
	});

	test("last conflicting utility wins", () => {
		expect(cn("p-2", "p-6")).toBe("p-6");
		expect(cn("bg-primary", "bg-destructive")).toBe("bg-destructive");
	});

	test("keeps non-conflicting utilities from the same group", () => {
		expect(cn("px-2", "py-4")).toBe("px-2 py-4");
	});

	test("an incoming className overrides the base", () => {
		expect(cn("rounded-lg bg-primary", "bg-secondary")).toBe("rounded-lg bg-secondary");
	});

	test("returns an empty string for no input", () => {
		expect(cn()).toBe("");
	});
});

// Without these, tailwind-merge treats `h-button-md` as an unrecognised
// utility and keeps it alongside a caller's `h-12`. Both would apply and the
// winner would be whichever uniwind resolved last — the exact failure `cn`
// exists to prevent, and an invisible one, since nothing errors.
describe("cn with the semantic size tokens", () => {
	test("a caller's plain utility replaces a token one", () => {
		for (const token of BUTTON_SIZE_TOKENS) {
			expect(cn(`h-${token}`, "h-12")).toBe("h-12");
			expect(cn(`w-${token}`, "w-12")).toBe("w-12");
		}
		for (const token of ICON_SIZE_TOKENS) {
			expect(cn(`size-${token}`, "size-6")).toBe("size-6");
		}
		for (const token of BUTTON_TEXT_TOKENS) {
			expect(cn(`text-${token}`, "text-lg")).toBe("text-lg");
		}
		// A field's height is read on two axes — fixed for a single line,
		// a floor for a multiline one — so `min-h` has to be recognised too.
		for (const token of INPUT_SIZE_TOKENS) {
			expect(cn(`h-${token}`, "h-12")).toBe("h-12");
			expect(cn(`min-h-${token}`, "min-h-12")).toBe("min-h-12");
		}
		for (const token of INPUT_TEXT_TOKENS) {
			expect(cn(`text-${token}`, "text-lg")).toBe("text-lg");
		}
		// The screen tokens are read on two different axes — `h-navbar-row` sizes
		// the navbar's row, `px-screen-gutter` its horizontal padding — so both
		// have to be recognised, not just the one each token was named for.
		for (const token of SCREEN_SIZE_TOKENS) {
			expect(cn(`h-${token}`, "h-12")).toBe("h-12");
			expect(cn(`px-${token}`, "px-8")).toBe("px-8");
		}
	});

	test("a token utility replaces a plain one", () => {
		expect(cn("h-12", "h-button-sm")).toBe("h-button-sm");
		expect(cn("size-6", "size-icon-xs")).toBe("size-icon-xs");
		expect(cn("text-lg", "text-button-sm")).toBe("text-button-sm");
		expect(cn("px-8", "px-screen-gutter")).toBe("px-screen-gutter");
		expect(cn("min-h-12", "min-h-input-lg")).toBe("min-h-input-lg");
	});

	test("one token replaces another on the same axis", () => {
		expect(cn("size-icon-sm", "size-icon-2xl")).toBe("size-icon-2xl");
		expect(cn("h-button-sm", "h-button-lg")).toBe("h-button-lg");
		expect(cn("h-input-sm", "h-input-lg")).toBe("h-input-lg");
		expect(cn("text-input-sm", "text-input-lg")).toBe("text-input-lg");
	});

	test("tokens on different axes both survive", () => {
		expect(cn("h-button-md", "w-button-md")).toBe("h-button-md w-button-md");
		expect(cn("size-icon-md", "text-button-md")).toBe("size-icon-md text-button-md");
		// `--color-input` and `--text-input-md` are different namespaces that
		// happen to share a word. A field sets both at once, so a merger that
		// judged them to conflict would silently strip one.
		expect(cn("border-input", "text-input-md")).toBe("border-input text-input-md");
	});
});
