import { describe, expect, test } from "bun:test";
import { fieldVariants, resolveFieldTextColor } from "../field/field.variants";
import { TEXT_COLORS } from "../text/text.variants";
import {
	LABEL_REQUIRED_MARK,
	LABEL_REQUIRED_MARK_COLOR,
	labelText,
	labelVariants,
	resolveLabelAccessibilityLabel,
	resolveLabelColor,
} from "./label.variants";

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * Both slots are handed to a `Text` and carry state only, so they are empty most
 * of the time — and a bare `not.toMatch()` throws on `undefined` rather than
 * passing.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

const SLOTS = ["root", "requiredMark"] as const;

describe("the slots", () => {
	// The type scale belongs to `Text.Label`. A size or a weight here would be a
	// second definition of it that could drift from the preset.
	test("restate no type scale in any state", () => {
		for (const isDisabled of [false, true]) {
			for (const isInvalid of [false, true]) {
				const slots = labelVariants({ isDisabled, isInvalid });
				for (const slot of SLOTS) {
					expect(cls(slots[slot]())).not.toMatch(/\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/);
					expect(cls(slots[slot]())).not.toMatch(/\bfont-(normal|medium|semibold|bold)\b/);
				}
			}
		}
	});

	// Colour rides `Text`'s own axis, so a caller's `color` beats it through the
	// same channel rather than through a tailwind-merge race.
	test("carry no colour, since that rides the preset's own axis", () => {
		for (const isInvalid of [false, true]) {
			const slots = labelVariants({ isInvalid });
			for (const slot of SLOTS) {
				expect(cls(slots[slot]())).not.toMatch(/\btext-\w+-?\w*\b/);
			}
		}
	});

	test("merge an incoming className last", () => {
		expect(labelVariants({ isDisabled: true }).root({ className: "opacity-80" })).toContain("opacity-80");
		expect(labelVariants({ isDisabled: true }).root({ className: "opacity-80" })).not.toContain("opacity-50");
		expect(labelVariants().requiredMark({ className: "ml-1" })).toContain("ml-1");
	});
});

describe("a disabled label", () => {
	test("fades", () => {
		expect(cls(labelVariants({ isDisabled: true }).root())).toContain("opacity-50");
		expect(cls(labelVariants({ isDisabled: false }).root())).not.toContain("opacity-50");
	});

	// The mark is a nested run inside the label's own text, so the root's opacity
	// already reaches it. Fading it again would square the fade.
	test("does not fade the required mark a second time", () => {
		expect(cls(labelVariants({ isDisabled: true }).requiredMark())).not.toContain("opacity");
	});

	test("is enabled by default", () => {
		expect(labelVariants().root()).toBe(labelVariants({ isDisabled: false }).root());
	});
});

describe("resolveLabelColor", () => {
	test("turns destructive only while invalid", () => {
		expect(resolveLabelColor(true)).toBe("destructive");
		expect(resolveLabelColor(false)).toBeUndefined();
	});

	// `undefined` means "leave the preset's own colour alone" — `Text`'s colour
	// axis emits nothing when it is not named.
	test("names a colour Text actually has", () => {
		expect(TEXT_COLORS).toContain(resolveLabelColor(true) ?? "default");
	});
});

describe("the required mark", () => {
	test("is an asterisk", () => {
		expect(LABEL_REQUIRED_MARK).toBe("*");
	});

	// Required is a warning about what the form will refuse, so it is drawn in
	// the colour of the refusal whether or not the field is currently wrong.
	test("is destructive, and a colour Text has", () => {
		expect(LABEL_REQUIRED_MARK_COLOR).toBe("destructive");
		expect(TEXT_COLORS).toContain(LABEL_REQUIRED_MARK_COLOR);
	});
});

describe("labelText", () => {
	test("reads a string or a number", () => {
		expect(labelText("Email")).toBe("Email");
		expect(labelText(42)).toBe("42");
	});

	test("joins an array of strings, the shape `{name} address` compiles to", () => {
		expect(labelText(["Work", " ", "email"])).toBe("Work email");
		expect(labelText(["Line ", 2])).toBe("Line 2");
	});

	// The holes a conditional child leaves behind are not text.
	test("skips null, undefined and booleans inside an array", () => {
		expect(labelText(["Email", null, undefined, false, true])).toBe("Email");
	});

	// An element could be anything — an icon, a link — and guessing at its text
	// would put words in a screen reader's mouth the caller never wrote.
	test("gives up on anything it cannot read as text", () => {
		expect(labelText({ type: "Icon" })).toBeUndefined();
		expect(labelText(["Email", { type: "Icon" }])).toBeUndefined();
		expect(labelText(undefined)).toBeUndefined();
		expect(labelText(null)).toBeUndefined();
	});

	test("treats empty text as nothing to read", () => {
		expect(labelText("")).toBeUndefined();
		expect(labelText(["", null])).toBeUndefined();
	});
});

describe("resolveLabelAccessibilityLabel", () => {
	// A nested asterisk reads as "star" — so a required label is announced by
	// what it means instead of by its punctuation.
	test("reads a required label as required, not as an asterisk", () => {
		expect(resolveLabelAccessibilityLabel({ children: "Email", isRequired: true })).toBe("Email, required");
	});

	test("leaves an optional label to the text itself", () => {
		expect(resolveLabelAccessibilityLabel({ children: "Email", isRequired: false })).toBeUndefined();
	});

	test("lets the caller's own label win", () => {
		expect(
			resolveLabelAccessibilityLabel({ accessibilityLabel: "Work email", children: "Email", isRequired: true })
		).toBe("Work email");
		expect(
			resolveLabelAccessibilityLabel({ accessibilityLabel: "Work email", children: "Email", isRequired: false })
		).toBe("Work email");
	});

	// With children it cannot read, the text stays whatever the platform makes
	// of it rather than becoming a bare "required" with the name dropped.
	test("says nothing when it cannot read the children", () => {
		expect(resolveLabelAccessibilityLabel({ children: { type: "Icon" }, isRequired: true })).toBeUndefined();
	});
});

// `Field.Label` is the field-aware counterpart of `Label`, styled from
// `fieldVariants`. A label in a field and a label outside one must not read as
// two different components, so the decision written twice is held together by a
// test rather than by a comment hoping it stays so.
describe("parity with Field", () => {
	test("colours the label the way Field's resolver does", () => {
		for (const isInvalid of [false, true]) {
			expect(resolveLabelColor(isInvalid)).toBe(resolveFieldTextColor("label", isInvalid));
		}
	});

	test("fades the label the way Field's slot does", () => {
		for (const isDisabled of [false, true]) {
			expect(cls(labelVariants({ isDisabled }).root())).toBe(cls(fieldVariants({ isDisabled }).label()));
		}
	});
});
