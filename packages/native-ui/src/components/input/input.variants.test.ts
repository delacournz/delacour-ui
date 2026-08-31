import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS, INPUT_SIZE_TOKENS, INPUT_TEXT_TOKENS } from "../../styles/tokens";
import {
	INPUT_INVALID_SELECTION_ACCENT_CLASS,
	INPUT_PLACEHOLDER_ACCENT_CLASS,
	INPUT_SELECTION_ACCENT_CLASS,
	INPUT_SIZES,
	INPUT_VARIANTS,
	type InputBoxState,
	inputVariants,
	resolveInputFieldClass,
	resolveInputGroupClass,
	resolvePlaceholderAccentClass,
	resolveSelectionAccentClass,
} from "./input.variants";

/** The `--spacing-input-*` token a class string sizes its box from, fixed or floored. */
function heightToken(cls: string): string | undefined {
	return cls.match(/\bmin-h-(input-[\w-]+)\b/)?.[1] ?? cls.match(/\bh-(input-[\w-]+)\b/)?.[1];
}

/** The `--text-input-*` token a class string sets its type scale from. */
function textToken(cls: string): string | undefined {
	return cls.match(/\btext-(input-[\w-]+)\b/)?.[1];
}

/**
 * Position of a class string's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so the test says what it means and
 * survives a token being retuned in `tokens.css`.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** The four on/off axes a box is drawn from, beside its variant and size. */
const BOOLEAN_BOX_AXES = ["isDisabled", "isFocused", "isInvalid", "isMultiline"] as const;

/**
 * Every combination of the axes that change the box.
 *
 * The boolean axes are enumerated as a bit pattern rather than as four nested
 * loops: the sweep is the point of the parity tests, so it has to cover the
 * whole matrix, and four more levels of indentation would bury what it covers.
 */
function everyBoxState(): InputBoxState[] {
	const states: InputBoxState[] = [];

	for (const variant of INPUT_VARIANTS) {
		for (const size of INPUT_SIZES) {
			for (let mask = 0; mask < 1 << BOOLEAN_BOX_AXES.length; mask += 1) {
				const state: InputBoxState = { size, variant };
				for (const [bit, axis] of BOOLEAN_BOX_AXES.entries()) {
					state[axis] = (mask & (1 << bit)) !== 0;
				}
				states.push(state);
			}
		}
	}

	return states;
}

describe("the root slot", () => {
	test("gives every variant a distinct treatment", () => {
		const seen = new Set(INPUT_VARIANTS.map((variant) => inputVariants({ variant }).root()));
		expect(seen.size).toBe(INPUT_VARIANTS.length);
	});

	test("draws a border in every variant, so focus and invalid have something to recolour", () => {
		for (const variant of INPUT_VARIANTS) {
			expect(inputVariants({ variant }).root()).toMatch(/\bborder-/);
		}
	});

	// A React Native `View` does not cascade colour to a `Text` descendant, and
	// when the field is grouped this slot lands on a View. Text colour belongs
	// to the field. See AGENTS.md rule 1.
	test("carries no text colour", () => {
		for (const state of everyBoxState()) {
			expect(inputVariants(state).root()).not.toMatch(/\btext-/);
		}
	});

	test("takes a height token from the input scale at every size", () => {
		for (const size of INPUT_SIZES) {
			const token = heightToken(inputVariants({ size }).root());
			expect(INPUT_SIZE_TOKENS).toContain(token as (typeof INPUT_SIZE_TOKENS)[number]);
		}
	});

	test("steps its height with its size", () => {
		const steps = INPUT_SIZES.map((size) =>
			INPUT_SIZE_TOKENS.indexOf(heightToken(inputVariants({ size }).root()) as never)
		);
		expect(steps).toEqual([0, 1, 2]);
	});

	test("marks focus and invalid with different borders", () => {
		const focused = inputVariants({ isFocused: true }).root();
		const invalid = inputVariants({ isInvalid: true }).root();
		const resting = inputVariants().root();
		expect(focused).not.toBe(resting);
		expect(invalid).not.toBe(resting);
		expect(focused).not.toBe(invalid);
	});

	// Focus is the transient state and invalid the reported one: a field that
	// went grey the moment it was tapped would drop the only signal it has that
	// its value is wrong, exactly while the value is being corrected.
	test("keeps an invalid field invalid while it is focused", () => {
		for (const variant of INPUT_VARIANTS) {
			const both = inputVariants({ isFocused: true, isInvalid: true, variant }).root();
			const invalid = inputVariants({ isInvalid: true, variant }).root();
			expect(both).toContain("border-destructive");
			expect(both).not.toContain("border-ring");
			expect(new Set(both.split(" "))).toEqual(new Set(invalid.split(" ")));
		}
	});

	test("fades a disabled field", () => {
		expect(inputVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(inputVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("merges an incoming className last", () => {
		expect(inputVariants().root({ className: "mb-6" })).toContain("mb-6");
		expect(inputVariants().root({ className: "bg-popover" })).not.toContain("bg-card");
	});
});

describe("a multiline field", () => {
	// A fixed height would clip the second line; a floor lets the box grow with
	// the text while still matching a single-line field at rest.
	test("turns the height into a floor rather than a fixed measure", () => {
		for (const size of INPUT_SIZES) {
			const single = inputVariants({ isMultiline: false, size }).root();
			const multi = inputVariants({ isMultiline: true, size }).root();
			expect(single).toMatch(/(?<![\w-])h-input-/);
			expect(single).not.toMatch(/\bmin-h-input-/);
			expect(multi).toMatch(/\bmin-h-input-/);
			expect(multi).not.toMatch(/(?<![\w-])h-input-/);
		}
	});

	test("floors at exactly the height a single-line field takes", () => {
		for (const size of INPUT_SIZES) {
			expect(heightToken(inputVariants({ isMultiline: true, size }).root())).toBe(
				heightToken(inputVariants({ isMultiline: false, size }).root())
			);
		}
	});

	// With the box free to grow, centring would drift the decorators down the
	// side of a paragraph. They belong on the first line.
	test("aligns the row to the top", () => {
		for (const size of INPUT_SIZES) {
			const row = resolveInputGroupClass({ isMultiline: true, size });
			expect(row).toContain("items-start");
			expect(row).not.toContain("items-center");
		}
	});
});

describe("the field slot", () => {
	test("carries the text colour, which the root must not", () => {
		expect(inputVariants().field()).toMatch(/\btext-foreground\b/);
	});

	test("takes a type scale token paired with its height", () => {
		for (const [index, size] of INPUT_SIZES.entries()) {
			expect(textToken(inputVariants({ size }).field())).toBe(INPUT_TEXT_TOKENS[index]);
			expect(heightToken(inputVariants({ size }).root())).toBe(INPUT_SIZE_TOKENS[index]);
		}
	});

	test("stretches only when it is sharing a row", () => {
		expect(inputVariants({ isGrouped: true }).field()).toContain("flex-1");
		expect(inputVariants({ isGrouped: false }).field()).not.toContain("flex-1");
	});

	test("merges an incoming className last", () => {
		expect(inputVariants().field({ className: "text-destructive" })).toContain("text-destructive");
		expect(inputVariants().field({ className: "text-destructive" })).not.toContain("text-foreground");
	});
});

describe("a decorator", () => {
	test("sizes its icon on the shared icon scale", () => {
		for (const size of INPUT_SIZES) {
			expect(iconStep(inputVariants({ size }).decoratorIcon())).toBeGreaterThanOrEqual(0);
		}
	});

	test("steps that icon up with the field's size", () => {
		const steps = INPUT_SIZES.map((size) => iconStep(inputVariants({ size }).decoratorIcon()));
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(INPUT_SIZES.length);
	});

	// An icon takes a colour value rather than a class — the slot sizes it only.
	test("puts no colour on the icon slot", () => {
		for (const size of INPUT_SIZES) {
			expect(inputVariants({ size }).decoratorIcon()).not.toMatch(/\b(bg|text|border)-/);
		}
	});

	test("sets affix text a step quieter than the value beside it", () => {
		for (const size of INPUT_SIZES) {
			const text = inputVariants({ size }).decoratorText();
			expect(text).toContain("text-muted-foreground");
			expect(textToken(text)).toBe(textToken(inputVariants({ size }).field()));
		}
	});

	test("turns its affix text destructive when the field is invalid", () => {
		expect(inputVariants({ isInvalid: true }).decoratorText()).toContain("text-destructive");
		expect(inputVariants({ isInvalid: true }).decoratorText()).not.toContain("text-muted-foreground");
	});
});

// The whole point of the design: one slot holds the box, and it lands on the
// `TextInput` when the field stands alone or on the group's row when it does
// not. These are the tests that make "identical by construction" a property the
// suite checks rather than a comment.
describe("the standalone and grouped boxes", () => {
	test("wear exactly the same chrome, wherever the chrome lands", () => {
		for (const state of everyBoxState()) {
			const chrome = inputVariants(state).root().split(" ");
			const alone = resolveInputFieldClass({ ...state, isGrouped: false }).split(" ");
			const row = resolveInputGroupClass(state).split(" ");

			for (const utility of chrome) {
				// `items-start` is the one class a grouped multiline row adds on
				// top of the box, since a lone field has nothing to align.
				if (utility === "items-start") continue;
				expect(alone).toContain(utility);
				expect(row).toContain(utility);
			}
		}
	});

	test("never draw two boxes: a grouped field carries no chrome of its own", () => {
		for (const state of everyBoxState()) {
			const grouped = resolveInputFieldClass({ ...state, isGrouped: true });
			expect(grouped).not.toMatch(/\bborder\b|\bborder-/);
			expect(grouped).not.toMatch(/\bbg-/);
			expect(grouped).not.toMatch(/\brounded/);
			expect(grouped).not.toMatch(/h-input-/);
			expect(grouped).not.toMatch(/\bpx-/);
		}
	});

	test("keep the text on the field, never on the row", () => {
		for (const state of everyBoxState()) {
			expect(resolveInputGroupClass(state)).not.toMatch(/\btext-/);
			expect(resolveInputFieldClass({ ...state, isGrouped: true })).toMatch(/\btext-/);
			expect(resolveInputFieldClass({ ...state, isGrouped: false })).toMatch(/\btext-/);
		}
	});

	test("lay the row out as a row, which a lone field has no need to be", () => {
		const state = { size: "md" as const, variant: "primary" as const };
		expect(resolveInputGroupClass(state)).toContain("flex-row");
		expect(resolveInputFieldClass({ ...state, isGrouped: false })).not.toContain("flex-row");
	});

	test("merge an incoming className last, on either path", () => {
		expect(resolveInputFieldClass({ className: "h-12", isGrouped: false })).toContain("h-12");
		expect(resolveInputFieldClass({ className: "h-12", isGrouped: false })).not.toContain("h-input-md");
		expect(resolveInputGroupClass({ className: "w-full" })).toContain("w-full");
	});
});

// Uniwind resolves these through `accentColor`, so the value has to be an
// `accent-*` utility — anything else warns once and draws nothing.
describe("the accent resolvers", () => {
	test("name accent utilities, since nothing else resolves", () => {
		for (const value of [
			INPUT_PLACEHOLDER_ACCENT_CLASS,
			INPUT_SELECTION_ACCENT_CLASS,
			INPUT_INVALID_SELECTION_ACCENT_CLASS,
		]) {
			expect(value).toMatch(/^accent-/);
		}
	});

	test("default the placeholder to the muted token", () => {
		expect(resolvePlaceholderAccentClass()).toBe(INPUT_PLACEHOLDER_ACCENT_CLASS);
	});

	test("let a caller replace the placeholder colour", () => {
		expect(resolvePlaceholderAccentClass("accent-destructive")).toBe("accent-destructive");
	});

	test("turn the caret and selection destructive while the field is invalid", () => {
		expect(resolveSelectionAccentClass({ isInvalid: false })).toBe(INPUT_SELECTION_ACCENT_CLASS);
		expect(resolveSelectionAccentClass({ isInvalid: true })).toBe(INPUT_INVALID_SELECTION_ACCENT_CLASS);
	});

	test("let a caller override even the invalid selection colour", () => {
		expect(resolveSelectionAccentClass({ className: "accent-info", isInvalid: true })).toBe("accent-info");
	});
});
