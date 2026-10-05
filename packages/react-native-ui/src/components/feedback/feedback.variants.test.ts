import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	canSubmitFeedback,
	FEEDBACK_DEFAULT_MIN_ROWS,
	FEEDBACK_FIELD_LINE_HEIGHT,
	feedbackVariants,
	resolveFeedbackFieldMinHeight,
} from "./feedback.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];

	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		// `text-input-md` is a size token, not a colour.
		if (utility === "text" && token.startsWith("input-")) continue;
		tokens.push(token);
	}

	return tokens;
}

/** Pinned rather than derived — `tv` adds a `base` slot of its own. */
const SLOT_NAMES = ["content", "panel", "title", "close", "field", "footer"] as const;

describe("feedbackVariants", () => {
	test("the shell paints the muted band and is tighter than a dialog's p-5", () => {
		const content = feedbackVariants().content();
		expect(content).toContain("bg-muted");
		expect(content).toMatch(/\bp-[1-3]\b/);
		expect(content).not.toContain("p-5");
	});

	test("the panel is a recessed well on the page colour, inset with the md corner and a hairline", () => {
		const panel = feedbackVariants().panel();
		expect(panel).toContain("bg-background");
		expect(panel).toContain("rounded-md");
		expect(panel).toContain("border");
		expect(panel).toContain("border-border");
		expect(panel).toMatch(/\bp-\d/);
	});

	test("the title reserves clearance for the close glyph and carries no type of its own", () => {
		const title = feedbackVariants().title();
		expect(title).toBe("pr-8");
	});

	test("the close glyph sits in the panel's top-right corner", () => {
		const close = feedbackVariants().close();
		expect(close).toContain("absolute");
		expect(close).toMatch(/\btop-\d/);
		expect(close).toMatch(/\bright-\d/);
	});

	test("the field has no box of its own and sets the input type on the house face", () => {
		const field = feedbackVariants().field();
		expect(field).toContain("font-sans");
		expect(field).toContain("text-input-md");
		expect(field).toContain("text-foreground");
		expect(field).toContain("leading-6");
		expect(field).not.toMatch(/\bborder\b/);
		expect(field).not.toMatch(/\bbg-/);
	});

	test("the footer is an end-aligned row with a narrower inset than the well's", () => {
		const footer = feedbackVariants().footer();
		expect(footer).toContain("flex-row");
		expect(footer).toContain("items-center");
		expect(footer).toContain("justify-end");
		expect(footer).toContain("gap-2");
		expect(footer).not.toMatch(/\bp-[4-9]\b/);
	});

	test("a caller's className reaches each slot and wins a conflict", () => {
		const panel = feedbackVariants().panel({ className: "rounded-xl" });
		expect(panel).toContain("rounded-xl");
		expect(panel).not.toContain("rounded-md");
	});
});

describe("every token the slots name", () => {
	test("is declared in both variants of theme.css", () => {
		const slots = feedbackVariants();
		for (const name of SLOT_NAMES) {
			for (const token of colorTokens(slots[name]())) {
				expect({ inLight: LIGHT.has(token), slot: name, token }).toEqual({ inLight: true, slot: name, token });
				expect({ inDark: DARK.has(token), slot: name, token }).toEqual({ inDark: true, slot: name, token });
			}
		}
	});

	test("the reader found tokens at all", () => {
		expect(colorTokens(feedbackVariants().content())).toContain("muted");
		expect(colorTokens(feedbackVariants().panel())).toEqual(expect.arrayContaining(["background", "border"]));
		expect(colorTokens(feedbackVariants().field())).toEqual(["foreground"]);
	});
});

describe("canSubmitFeedback", () => {
	test("an empty message cannot be sent", () => {
		expect(canSubmitFeedback({ value: "" })).toBe(false);
	});

	test("whitespace is empty", () => {
		expect(canSubmitFeedback({ value: "   \n\t " })).toBe(false);
	});

	test("any text can be sent", () => {
		expect(canSubmitFeedback({ value: "The export button is hidden" })).toBe(true);
		expect(canSubmitFeedback({ value: "  x  " })).toBe(true);
	});

	test("canSubmitEmpty lets an empty message through", () => {
		expect(canSubmitFeedback({ canSubmitEmpty: true, value: "" })).toBe(true);
		expect(canSubmitFeedback({ canSubmitEmpty: true, value: "  " })).toBe(true);
	});

	test("disabled outranks everything", () => {
		expect(canSubmitFeedback({ isDisabled: true, value: "text" })).toBe(false);
		expect(canSubmitFeedback({ canSubmitEmpty: true, isDisabled: true, value: "" })).toBe(false);
	});
});

describe("resolveFeedbackFieldMinHeight", () => {
	test("the line height is the field's leading-6", () => {
		expect(FEEDBACK_FIELD_LINE_HEIGHT).toBe(24);
	});

	test("defaults to six rows", () => {
		expect(FEEDBACK_DEFAULT_MIN_ROWS).toBe(6);
		expect(resolveFeedbackFieldMinHeight(undefined, FEEDBACK_FIELD_LINE_HEIGHT)).toBe(144);
	});

	test("is rows times the line height", () => {
		expect(resolveFeedbackFieldMinHeight(3, 24)).toBe(72);
		expect(resolveFeedbackFieldMinHeight(1, 20)).toBe(20);
	});

	test("floors to whole rows and clamps to at least one", () => {
		expect(resolveFeedbackFieldMinHeight(2.7, 24)).toBe(48);
		expect(resolveFeedbackFieldMinHeight(0, 24)).toBe(24);
		expect(resolveFeedbackFieldMinHeight(-3, 24)).toBe(24);
	});

	test("falls back to the default on a number that is not one", () => {
		expect(resolveFeedbackFieldMinHeight(Number.NaN, 24)).toBe(144);
		expect(resolveFeedbackFieldMinHeight(Number.POSITIVE_INFINITY, 24)).toBe(144);
	});
});
