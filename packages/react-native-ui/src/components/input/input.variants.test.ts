import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS, INPUT_SIZE_TOKENS, INPUT_TEXT_TOKENS } from "../../styles/tokens";
import {
	BUTTON_GROUP_ORIENTATIONS,
	BUTTON_GROUP_POSITIONS,
	BUTTON_SIZES,
	buttonVariants,
	resolveButtonSizeStep,
} from "../button/button.variants";
import {
	INPUT_GROUP_PLACEMENTS,
	INPUT_INVALID_SELECTION_ACCENT_CLASS,
	INPUT_PLACEHOLDER_ACCENT_CLASS,
	INPUT_SELECTION_ACCENT_CLASS,
	INPUT_SIZES,
	INPUT_VARIANTS,
	type InputBoxState,
	inputVariants,
	resolveGroupButtonClass,
	resolveGroupButtonSize,
	resolveGroupSegments,
	resolveInputAccessibilityLabel,
	resolveInputFieldClass,
	resolveInputGroupClass,
	resolveInputGroupRowClass,
	resolveIsDecorative,
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

/** Every `rounded-*` class a root string carries, in emission order. */
function radiusClasses(cls: string): string[] {
	return cls.match(/\brounded-[\w-]+\b/g) ?? [];
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

describe("Input accessible name", () => {
	test("uses the enclosing Field.Label when the caller omits a label", () => {
		expect(resolveInputAccessibilityLabel(undefined, "Email address")).toBe("Email address");
		expect(resolveInputAccessibilityLabel(undefined, null)).toBeUndefined();
	});

	test("preserves an explicit caller label, including an empty string", () => {
		expect(resolveInputAccessibilityLabel("Work email", "Email address")).toBe("Work email");
		expect(resolveInputAccessibilityLabel("", "Email address")).toBe("");
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
			const row = resolveInputGroupRowClass({ isMultiline: true, size });
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

	test("keep the text on the field, never on the box or the row", () => {
		for (const state of everyBoxState()) {
			expect(resolveInputGroupClass(state)).not.toMatch(/\btext-/);
			expect(resolveInputGroupRowClass(state)).not.toMatch(/\btext-/);
			expect(resolveInputFieldClass({ ...state, isGrouped: true })).toMatch(/\btext-/);
			expect(resolveInputFieldClass({ ...state, isGrouped: false })).toMatch(/\btext-/);
		}
	});

	test("lay the row out as a row, which a lone field has no need to be", () => {
		const state = { size: "md" as const, variant: "primary" as const };
		expect(resolveInputGroupRowClass(state)).toContain("flex-row");
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

describe("a joined field's corner", () => {
	test("draws the generic ramp when it stands on its own", () => {
		// A field and the button beside it are meant to be retunable apart, so a
		// lone field takes `--radius`, never the button's shape token.
		expect(radiusClasses(inputVariants({ size: "sm" }).root())).toEqual(["rounded-md"]);
		expect(radiusClasses(inputVariants({ size: "md" }).root())).toEqual(["rounded-lg"]);
		expect(radiusClasses(inputVariants({ size: "lg" }).root())).toEqual(["rounded-lg"]);
	});

	test("draws the group's corner, cell for cell, when it is joined", () => {
		// The whole point of teaching a field to join: a run capped by a field at
		// one end and a button at the other has to draw one arc, not two ramps
		// meeting in the middle. Asserted against the button's own variants
		// rather than against a copied string, so the two cannot drift apart.
		// Swept over the button's own six sizes, reading each one's step: a field
		// has no square form, so it joins a run at the step the group is built on.
		for (const buttonSize of BUTTON_SIZES) {
			const size = resolveButtonSizeStep(buttonSize);
			for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
				for (const groupPosition of BUTTON_GROUP_POSITIONS) {
					expect(radiusClasses(inputVariants({ groupPosition, orientation, size }).root())).toEqual(
						radiusClasses(buttonVariants({ groupPosition, orientation, size: buttonSize }).root())
					);
				}
			}
		}
	});

	test("overlaps its neighbour exactly as a button does", () => {
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			const field = inputVariants({ isSeamed: true, orientation }).root();
			const button = buttonVariants({ isSeamed: true, orientation }).root();
			const seam = /\B-(?:ms|mt)-px\b/;

			expect(field.match(seam)?.[0]).toBe(button.match(seam)?.[0]);
			expect(inputVariants({ isSeamed: false, orientation }).root()).not.toMatch(seam);
		}
	});

	test("never mixes a physical corner with a logical one", () => {
		for (const size of INPUT_SIZES) {
			for (const groupPosition of BUTTON_GROUP_POSITIONS) {
				expect(inputVariants({ groupPosition, orientation: "horizontal", size }).root()).not.toMatch(
					/\brounded-[trbl]-/
				);
				expect(inputVariants({ groupPosition, orientation: "vertical", size }).root()).not.toMatch(/\brounded-[se]-/);
			}
		}
	});
});

describe("the etched input variant", () => {
	test("is listed after the two flat variants", () => {
		expect(INPUT_VARIANTS).toEqual(["primary", "secondary", "etched"]);
	});

	test("is a card fill with the input border and the light and dark edge", () => {
		const cls = inputVariants({ variant: "etched" }).root();
		expect(cls).toContain("bg-card");
		expect(cls).toContain("border-input");
		expect(cls).toContain("shadow-etched");
		expect(cls).toContain("dark:shadow-etched-dark");
	});

	test("focus swaps the border to the ring and adds the 3px halo", () => {
		const cls = inputVariants({ isFocused: true, variant: "etched" }).root();
		expect(cls).toContain("border-ring");
		expect(cls).toContain("shadow-focus");
		expect(cls).toContain("dark:shadow-focus-dark");
		expect(cls).not.toContain("shadow-etched");
	});

	test("invalid outranks focus", () => {
		const cls = inputVariants({ isFocused: true, isInvalid: true, variant: "etched" }).root();
		expect(cls).toContain("border-destructive");
		expect(cls).not.toContain("shadow-focus");
	});

	test("the flat variants draw no shadow", () => {
		expect(inputVariants({ isFocused: true, variant: "primary" }).root()).not.toMatch(/shadow/);
	});
});

// The group's box and its row used to be one element. The row is now an inner
// view, so a block can sit above or below it inside the same box — and the box
// must still be drawn exactly once, on the outer element.
describe("the group's box and its inner row", () => {
	test("put every chrome utility on the box and none on the row", () => {
		for (const state of everyBoxState()) {
			const box = resolveInputGroupClass(state);
			const row = resolveInputGroupRowClass(state);
			for (const utility of inputVariants(state).root().split(" ")) {
				expect(box.split(" ")).toContain(utility);
			}
			expect(row).not.toMatch(/\bborder\b|\bborder-/);
			expect(row).not.toMatch(/\bbg-/);
			expect(row).not.toMatch(/\brounded/);
			expect(row).not.toMatch(/h-input-/);
			expect(row).not.toMatch(/\bopacity-/);
		}
	});

	test("keep the row's layout off the box", () => {
		for (const state of everyBoxState()) {
			expect(resolveInputGroupClass(state)).not.toContain("flex-row");
			expect(resolveInputGroupRowClass(state)).toContain("flex-row");
		}
	});

	test("grow the row to the box's height without collapsing an unsized box", () => {
		const row = resolveInputGroupRowClass({});
		expect(row).toMatch(/\bgrow\b/);
		expect(row).not.toMatch(/\bflex-1\b/);
	});

	test("lets the box grow past one line once it holds a block", () => {
		for (const size of INPUT_SIZES) {
			const box = resolveInputGroupClass({ hasBlocks: true, size });
			expect(box).toMatch(/\bmin-h-input-/);
			expect(box).not.toMatch(/(?<![\w-])h-input-/);
		}
	});

	test("keeps a single-line field centred in its row when a block is present", () => {
		const row = resolveInputGroupRowClass({ hasBlocks: true, size: "md" });
		expect(row).toContain("items-center");
		expect(row).not.toContain("items-start");
	});

	test("tops a multiline field's row and drops the fixed height with blocks present", () => {
		for (const size of INPUT_SIZES) {
			const box = resolveInputGroupClass({ hasBlocks: true, isMultiline: true, size });
			const row = resolveInputGroupRowClass({ hasBlocks: true, isMultiline: true, size });
			expect(row).toContain("items-start");
			expect(box).not.toMatch(/(?<![\w-])h-input-/);
		}
	});

	test("keeps invalid above focus with blocks present", () => {
		const box = resolveInputGroupClass({ hasBlocks: true, isFocused: true, isInvalid: true });
		expect(box).toContain("border-destructive");
		expect(box).not.toContain("border-ring");
	});

	test("merges an incoming className onto the box", () => {
		expect(resolveInputGroupClass({ className: "w-full" })).toContain("w-full");
		expect(resolveInputGroupRowClass({ className: "gap-0" })).toContain("gap-0");
	});
});

describe("a block", () => {
	test("steps its vertical padding with the group's size", () => {
		const paddings = INPUT_SIZES.map(
			(size) =>
				inputVariants({ size })
					.block()
					.match(/\bpy-[\d.]+\b/)?.[0]
		);
		expect(paddings.every(Boolean)).toBe(true);
		expect(new Set(paddings).size).toBe(INPUT_SIZES.length);
	});

	test("takes its horizontal inset from the box rather than restating it", () => {
		for (const size of INPUT_SIZES) {
			expect(inputVariants({ size }).block()).not.toMatch(/\bpx-/);
		}
	});

	test("lays its content out as a row", () => {
		expect(inputVariants().block()).toContain("flex-row");
	});

	test("carries no raw palette colour and no chrome", () => {
		for (const state of everyBoxState()) {
			const block = inputVariants(state).block();
			expect(block).not.toMatch(/\b(bg|text|border)-(?:[a-z]+-\d{2,3}|black|white)\b/);
			expect(block).not.toMatch(/\bborder\b|\bbg-|\brounded/);
		}
	});
});

describe("a separator", () => {
	test("draws a vertical hairline inside a row", () => {
		const cls = inputVariants({ placement: "row" }).separator();
		expect(cls).toContain("w-px");
		expect(cls).toContain("self-stretch");
		expect(cls).not.toContain("h-px");
	});

	test("draws a horizontal hairline between the box's sections", () => {
		const cls = inputVariants({ placement: "box" }).separator();
		expect(cls).toContain("h-px");
		expect(cls).not.toContain("w-px");
	});

	test("uses the border token at both placements", () => {
		for (const placement of INPUT_GROUP_PLACEMENTS) {
			expect(inputVariants({ placement }).separator()).toContain("bg-border");
		}
	});

	// The box's own horizontal padding would leave a horizontal hairline short
	// of both edges. It bleeds out by exactly that padding, so it meets the border.
	test("bleeds a horizontal hairline out by exactly the box's inset", () => {
		for (const size of INPUT_SIZES) {
			const inset = inputVariants({ size })
				.root()
				.match(/\bpx-([\d.]+)\b/)?.[1];
			const bleed = inputVariants({ placement: "box", size })
				.separator()
				.match(/(?:^|\s)-mx-([\d.]+)\b/)?.[1];
			expect(bleed).toBe(inset);
			expect(inputVariants({ placement: "row", size }).separator()).not.toMatch(/-mx-/);
		}
	});
});

describe("resolveIsDecorative", () => {
	test("lets an explicit value win", () => {
		expect(resolveIsDecorative({ explicit: true, kinds: ["other"] })).toBe(true);
		expect(resolveIsDecorative({ explicit: false, kinds: ["text"] })).toBe(false);
		expect(resolveIsDecorative({ explicit: false, kinds: ["icon"] })).toBe(false);
	});

	test("treats bare text as decorative", () => {
		expect(resolveIsDecorative({ kinds: ["text"] })).toBe(true);
		expect(resolveIsDecorative({ kinds: ["text", "text"] })).toBe(true);
	});

	test("treats a lone icon, or an icon beside text, as decorative", () => {
		expect(resolveIsDecorative({ kinds: ["icon"] })).toBe(true);
		expect(resolveIsDecorative({ kinds: ["icon", "text"] })).toBe(true);
	});

	test("keeps anything else interactive", () => {
		expect(resolveIsDecorative({ kinds: ["other"] })).toBe(false);
		expect(resolveIsDecorative({ kinds: ["icon", "other"] })).toBe(false);
	});

	test("keeps an empty decorator interactive", () => {
		expect(resolveIsDecorative({ kinds: [] })).toBe(false);
	});
});

describe("resolveGroupButtonSize", () => {
	test("steps a labelled button one below the box", () => {
		expect(resolveGroupButtonSize("sm", false)).toBe("sm");
		expect(resolveGroupButtonSize("md", false)).toBe("sm");
		expect(resolveGroupButtonSize("lg", false)).toBe("md");
	});

	test("squares an icon-only button at the same step", () => {
		expect(resolveGroupButtonSize("sm", true)).toBe("icon-sm");
		expect(resolveGroupButtonSize("md", true)).toBe("icon-sm");
		expect(resolveGroupButtonSize("lg", true)).toBe("icon-md");
	});

	test("never makes a button taller than the box it sits in", () => {
		for (const size of INPUT_SIZES) {
			for (const isIconOnly of [false, true]) {
				const step = resolveButtonSizeStep(resolveGroupButtonSize(size, isIconOnly));
				expect(INPUT_SIZES.indexOf(step)).toBeLessThanOrEqual(INPUT_SIZES.indexOf(size));
			}
		}
	});
});

// The group fades the whole box once. A button inside it that faded itself too
// would sit at a quarter opacity, darker-than-disabled.
describe("resolveGroupButtonClass", () => {
	test("cancels the button's own fade while the group is disabled", () => {
		const root = buttonVariants({ isDisabled: true }).root({
			className: resolveGroupButtonClass({ isDisabled: true }),
		});
		expect(root).not.toContain("opacity-50");
		expect(root).toContain("opacity-100");
	});

	test("adds nothing while the group is enabled", () => {
		expect(resolveGroupButtonClass({ isDisabled: false })).toBe("");
	});

	test("keeps a caller's className", () => {
		expect(resolveGroupButtonClass({ className: "-me-2", isDisabled: true })).toContain("-me-2");
	});
});

describe("resolveGroupSegments", () => {
	test("puts everything in the row when there are no blocks", () => {
		expect(resolveGroupSegments(["content", "separator", "content"])).toEqual(["row", "row", "row"]);
	});

	test("sends a block where its position says, whatever its order", () => {
		expect(resolveGroupSegments(["block-end", "content", "block-start"])).toEqual(["end", "row", "start"]);
	});

	test("lifts a separator out of the row when it sits outside the content", () => {
		expect(resolveGroupSegments(["block-start", "separator", "content", "separator", "block-end"])).toEqual([
			"start",
			"start",
			"row",
			"end",
			"end",
		]);
	});

	test("keeps a separator between content in the row", () => {
		expect(resolveGroupSegments(["content", "separator", "content", "block-end"])).toEqual([
			"row",
			"row",
			"row",
			"end",
		]);
	});

	test("handles an empty group", () => {
		expect(resolveGroupSegments([])).toEqual([]);
	});
});
