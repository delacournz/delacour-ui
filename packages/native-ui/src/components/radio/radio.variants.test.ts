import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { TEXT_SIZES } from "../text/text.variants";
import {
	RADIO_DEFAULT_SIZE,
	RADIO_DEFAULT_VARIANT,
	RADIO_DOT_SPRING,
	RADIO_LABEL_TEXT_SIZE,
	RADIO_ORIENTATIONS,
	RADIO_SIZES,
	RADIO_VARIANTS,
	radioVariants,
	resolveIndicatorPlacement,
	resolveRadioState,
	shouldEmitSelection,
} from "./radio.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");

/** Points behind a `--spacing-*` token, failing loudly rather than yielding NaN. */
function spacingPx(token: string): number {
	const value = TOKENS_CSS.match(new RegExp(`--spacing-${token}:\\s*([\\d.]+)px;`))?.[1];
	if (value === undefined) throw new Error(`tokens.css defines no --spacing-${token}`);
	return Number(value);
}

/** Tailwind's own spacing scale, in points. `size-2` is eight. */
const SPACING_STEP_PX = 4;

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * A slot that emits nothing returns `undefined` rather than `""` — correct, but
 * it makes a bare `not.toMatch()` throw rather than pass. The reader
 * `field.variants.test.ts` already uses.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The gap step a class string sets — `gap-2.5` yields 2.5. */
function gapStep(value: string): number {
	return Number(value.match(/\bgap-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `min-h-*` step a class string sets — `min-h-11` yields 11. */
function minHeightStep(value: string): number {
	return Number(value.match(/\bmin-h-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `size-*` step a class string sets, for a plain spacing step — `size-2` yields 2. */
function sizeStep(value: string): number {
	return Number(value.match(/\bsize-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/**
 * Position of a slot's `size-icon-*` token on the shared icon scale.
 *
 * The helper `badge.variants.test.ts` and `input.variants.test.ts` already use —
 * a radio's ring has to sit on the scale `Icon` and `Spinner` share rather than
 * carry a private number.
 */
function iconStep(value: string): number {
	const token = value.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** Every combination of the axes that paint a radio, as `tv` props. */
function everyCell(): {
	variant: (typeof RADIO_VARIANTS)[number];
	size: (typeof RADIO_SIZES)[number];
	isSelected: boolean;
	isInvalid: boolean;
	isDisabled: boolean;
}[] {
	const cells = [];
	for (const variant of RADIO_VARIANTS) {
		for (const size of RADIO_SIZES) {
			for (const isSelected of [false, true]) {
				for (const isInvalid of [false, true]) {
					for (const isDisabled of [false, true]) {
						cells.push({ variant, size, isSelected, isInvalid, isDisabled });
					}
				}
			}
		}
	}
	return cells;
}

const CELLS = everyCell();

describe("the tokens.css reader", () => {
	// The dot-fits-inside-the-ring assertion is only worth anything if the parse
	// found real numbers.
	test("finds the icon scale", () => {
		for (const token of ICON_SIZE_TOKENS) {
			expect(spacingPx(token)).toBeGreaterThan(0);
		}
	});
});

describe("the group slot", () => {
	test("lays its radios out on one axis or the other, never both", () => {
		expect(radioVariants({ orientation: "vertical" }).group()).toContain("flex-col");
		expect(radioVariants({ orientation: "vertical" }).group()).not.toContain("flex-row");
		expect(radioVariants({ orientation: "horizontal" }).group()).toContain("flex-row");
		expect(radioVariants({ orientation: "horizontal" }).group()).not.toContain("flex-col");
	});

	test("gives every orientation a treatment of its own", () => {
		const seen = new Set(RADIO_ORIENTATIONS.map((orientation) => radioVariants({ orientation }).group()));
		expect(seen.size).toBe(RADIO_ORIENTATIONS.length);
	});

	test("stacks vertically by default", () => {
		expect(radioVariants().group()).toBe(radioVariants({ orientation: "vertical" }).group());
	});

	// A horizontal group runs out of width long before it runs out of options.
	test("wraps only when horizontal", () => {
		expect(radioVariants({ orientation: "horizontal" }).group()).toContain("flex-wrap");
		expect(radioVariants({ orientation: "vertical" }).group()).not.toContain("flex-wrap");
	});

	test("steps its gap with size", () => {
		const gaps = RADIO_SIZES.map((size) => gapStep(radioVariants({ size }).group()));
		expect(gaps.every(Number.isFinite)).toBe(true);
		expect(new Set(gaps).size).toBe(RADIO_SIZES.length);
		expect([...gaps]).toEqual([...gaps].sort((a, b) => a - b));
	});

	// A disabled group is N faded rows. Fading the box as well would compound
	// `opacity-50` twice and land the whole group at a quarter opacity.
	test("paints no state of its own", () => {
		expect(radioVariants({ isDisabled: true }).group()).not.toContain("opacity-50");
		expect(radioVariants({ isInvalid: true }).group()).toBe(radioVariants({ isInvalid: false }).group());
	});

	test("merges an incoming className last", () => {
		expect(radioVariants().group({ className: "gap-8" })).toContain("gap-8");
		expect(radioVariants().group({ className: "gap-8" })).not.toContain("gap-3");
	});
});

describe("the root slot", () => {
	// A radio row IS its own tap target, so unlike a Badge it wants the stretch
	// it gets inside the group's flex-col. `self-start` would shrink the target
	// to the width of the word "Yes".
	test("never stops itself stretching, at any size", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).root()).not.toContain("self-start");
		}
	});

	// ...but it cannot take `w-full` either, or a horizontal group would give
	// every radio the group's full width and blow the row apart.
	test("never takes a width, so a horizontal group can size it by content", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).root()).not.toMatch(/\bw-/);
		}
	});

	// A floor, not a ceiling. `Text` respects OS font scaling, so a fixed height
	// clips the label at a large accessibility step instead of growing with it.
	test("floors its height rather than fixing it", () => {
		for (const size of RADIO_SIZES) {
			const root = radioVariants({ size }).root();
			expect(minHeightStep(root)).toBeGreaterThan(0);
			expect(root).not.toMatch(/(?<![\w-])h-\d/);
		}
	});

	test("gives every size a distinct floor, increasing with it", () => {
		const floors = RADIO_SIZES.map((size) => minHeightStep(radioVariants({ size }).root()));
		expect(new Set(floors).size).toBe(RADIO_SIZES.length);
		expect([...floors]).toEqual([...floors].sort((a, b) => a - b));
	});

	// The platform guideline is 44pt, and the default size has to clear it.
	test("clears the platform hit target at the default size", () => {
		expect(minHeightStep(radioVariants({ size: RADIO_DEFAULT_SIZE }).root()) * SPACING_STEP_PX).toBeGreaterThanOrEqual(
			44
		);
	});

	test("steps its gap with size", () => {
		const gaps = RADIO_SIZES.map((size) => gapStep(radioVariants({ size }).root()));
		expect(gaps.every(Number.isFinite)).toBe(true);
		expect([...gaps]).toEqual([...gaps].sort((a, b) => a - b));
	});

	// `root` is worn by Pressable's own Animated.View, whose useAnimatedStyle
	// writes `opacity` every frame. A class here is overwritten before it is
	// drawn — silently — so the fade has to live on the children instead.
	test("never carries an opacity, which Pressable's animated style would overwrite", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).root()).not.toMatch(/\bopacity-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(radioVariants().root({ className: "gap-8" })).toContain("gap-8");
		expect(radioVariants().root({ className: "gap-8" })).not.toContain("gap-2.5");
	});
});

describe("the indicator slot", () => {
	test("is a circle in every cell", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).indicator()).toContain("rounded-full");
		}
	});

	// The border is always in the box, so selecting or switching variant only
	// ever recolours it — it never resizes the ring by four points.
	test("reserves its border in every cell", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).indicator()).toMatch(/\bborder-2\b/);
		}
	});

	test("names a border colour in every cell", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).indicator()).toMatch(/\bborder-(?!2\b)[\w-]+/);
		}
	});

	test("sizes from the scale Icon and Spinner share", () => {
		const steps = RADIO_SIZES.map((size) => iconStep(radioVariants({ size }).indicator()));
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect(new Set(steps).size).toBe(RADIO_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// Every cell of the matrix has to be reachable. Two cells collapsing means a
	// caller can set an axis and see nothing change.
	test("gives all four variant and selection pairs a distinct treatment", () => {
		const seen = new Set<string>();
		for (const variant of RADIO_VARIANTS) {
			for (const isSelected of [false, true]) {
				seen.add(radioVariants({ variant, isSelected }).indicator());
			}
		}
		expect(seen.size).toBe(RADIO_VARIANTS.length * 2);
	});

	// Invalid is reported and selection is routine, so invalid outranks it — the
	// precedence `Input` gives invalid over focus, and for the same reason.
	test("stays danger while invalid, whatever else is set", () => {
		for (const cell of CELLS.filter((one) => one.isInvalid)) {
			const indicator = radioVariants(cell).indicator();
			expect(indicator).toContain("border-danger");
			expect(indicator).not.toContain("border-primary");
			expect(indicator).not.toContain("border-input");
			expect(indicator).not.toContain("border-border");
		}
	});

	test("carries no text colour, in any cell", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).indicator()).not.toMatch(/\btext-/);
		}
	});
});

describe("the dot slot", () => {
	// Its colour is unconditional rather than gated on `isSelected`, so a dot
	// being deselected keeps its fill while it animates out. Gate the class and
	// the dot vanishes on the frame the state flips, instead of shrinking.
	test("names a fill whether selected or not", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).dot()).toMatch(/\bbg-[\w-]+/);
		}
	});

	test("turns danger while invalid", () => {
		expect(radioVariants({ isInvalid: true }).dot()).toContain("bg-danger");
		expect(radioVariants({ isInvalid: false }).dot()).not.toContain("bg-danger");
	});

	// This is the assertion that stands in for a `--spacing-radio-*` token scale:
	// it makes the ring-to-dot coupling checked rather than merely hoped for.
	test("fits inside its own ring at every size, border included", () => {
		for (const size of RADIO_SIZES) {
			const slots = radioVariants({ size });
			const ringToken = slots.indicator().match(/\bsize-(icon-[\w-]+)\b/)?.[1];
			const ringPx = spacingPx(ringToken as string);
			const borderPx = 2;
			const dotPx = sizeStep(slots.dot()) * SPACING_STEP_PX;
			expect(dotPx).toBeGreaterThan(0);
			expect(dotPx).toBeLessThan(ringPx - 2 * borderPx);
		}
	});

	test("steps with the ring, so the pair reads the same at every size", () => {
		const dots = RADIO_SIZES.map((size) => sizeStep(radioVariants({ size }).dot()));
		expect(new Set(dots).size).toBe(RADIO_SIZES.length);
		expect([...dots]).toEqual([...dots].sort((a, b) => a - b));
	});

	// Both belong to the animated style. A class fighting a `useAnimatedStyle`
	// for the same property is a dot that never appears, with no error anywhere.
	test("claims neither opacity nor scale, which the animation owns", () => {
		for (const cell of CELLS) {
			const dot = radioVariants(cell).dot();
			expect(dot).not.toMatch(/\bopacity-/);
			expect(dot).not.toMatch(/\bscale-/);
		}
	});

	test("carries no text colour, in any cell", () => {
		for (const cell of CELLS) {
			expect(radioVariants(cell).dot()).not.toMatch(/\btext-/);
		}
	});
});

describe("the label slot", () => {
	// The scale belongs to `Text.Label`, which the part renders. Restating it
	// here would be a second definition that could drift from it — the rule
	// `Field` is built on, and the reason `Input` ships no label part at all.
	test("restates no type scale", () => {
		for (const cell of CELLS) {
			const label = cls(radioVariants(cell).label());
			expect(label).not.toMatch(/\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/);
			expect(label).not.toMatch(/\bfont-(normal|medium|semibold|bold)\b/);
		}
	});

	test("carries no colour either, not even while invalid", () => {
		for (const cell of CELLS) {
			expect(cls(radioVariants(cell).label())).not.toMatch(/\btext-[\w-]+/);
		}
	});

	// `flex-1` sets `flex-basis: 0%`, and in a content-sized horizontal row Yoga
	// resolves that to zero — collapsing the label to nothing.
	test("shrinks rather than claiming a basis", () => {
		for (const cell of CELLS) {
			const label = cls(radioVariants(cell).label());
			expect(label).toContain("shrink");
			expect(label).not.toMatch(/\bflex-1\b/);
		}
	});
});

describe("resolveIndicatorPlacement", () => {
	test("reports nothing to place when the caller wrote no indicator", () => {
		expect(resolveIndicatorPlacement([])).toBe("none");
		expect(resolveIndicatorPlacement([false, false])).toBe("none");
	});

	test("reports a leading indicator", () => {
		expect(resolveIndicatorPlacement([true, false])).toBe("start");
		expect(resolveIndicatorPlacement([true, false, false])).toBe("start");
	});

	// A settings row: the content takes the left and the ring the far right.
	test("reports a trailing indicator when something comes before it", () => {
		expect(resolveIndicatorPlacement([false, true])).toBe("end");
		expect(resolveIndicatorPlacement([false, false, true])).toBe("end");
	});

	// There is nothing to spread a lone ring away from.
	test("treats a lone indicator as leading", () => {
		expect(resolveIndicatorPlacement([true])).toBe("start");
	});

	test("ignores an indicator that is neither first nor last", () => {
		expect(resolveIndicatorPlacement([false, true, false])).toBe("start");
	});
});

describe("a trailing indicator", () => {
	// Without this the caller has to wedge a `flex-1` spacer between the content
	// and the ring to get a settings row, which is a layout hack in every call site.
	test("spreads the row, so the ring reaches the far edge", () => {
		expect(radioVariants({ isIndicatorTrailing: true }).root()).toContain("justify-between");
	});

	test("leaves a leading indicator packed against its label", () => {
		expect(radioVariants({ isIndicatorTrailing: false }).root()).not.toContain("justify-between");
		expect(radioVariants().root()).not.toContain("justify-between");
	});

	// The row is still one control however the ring is placed.
	test("changes nothing else about the row", () => {
		for (const size of RADIO_SIZES) {
			const trailing = radioVariants({ isIndicatorTrailing: true, size }).root();
			const leading = radioVariants({ isIndicatorTrailing: false, size }).root();
			expect(trailing.replace(" justify-between", "").split(" ").sort()).toEqual(leading.split(" ").sort());
		}
	});
});

describe("a disabled radio", () => {
	// The ring and the label are ordinary descendants of the pressable, so their
	// opacity multiplies with the root's rather than being overwritten by it.
	test("fades its ring and its label", () => {
		expect(radioVariants({ isDisabled: true }).indicator()).toContain("opacity-50");
		expect(cls(radioVariants({ isDisabled: true }).label())).toContain("opacity-50");
	});

	test("fades nothing when it is not disabled", () => {
		expect(radioVariants({ isDisabled: false }).indicator()).not.toContain("opacity-50");
		expect(cls(radioVariants({ isDisabled: false }).label())).not.toContain("opacity-50");
	});

	// The dot sits inside an already-faded ring, and its own opacity belongs to
	// the selection animation — a class here would fight the animated style.
	test("leaves the dot alone, whose opacity the animation owns", () => {
		expect(radioVariants({ isDisabled: true }).dot()).not.toMatch(/\bopacity-/);
	});
});

describe("the defaults", () => {
	// Two places name them — `defaultVariants` and `resolveRadioState` — and a
	// drift between the two is a radio that renders at one size and reports another.
	test("the named constants are the ones tv falls back to", () => {
		expect(radioVariants().root()).toBe(radioVariants({ size: RADIO_DEFAULT_SIZE }).root());
		expect(radioVariants().indicator()).toBe(
			radioVariants({ size: RADIO_DEFAULT_SIZE, variant: RADIO_DEFAULT_VARIANT }).indicator()
		);
	});
});

describe("RADIO_LABEL_TEXT_SIZE", () => {
	test("names a size the Text component actually has", () => {
		for (const size of RADIO_SIZES) {
			expect(TEXT_SIZES).toContain(RADIO_LABEL_TEXT_SIZE[size]);
		}
	});

	test("covers every radio size", () => {
		for (const size of RADIO_SIZES) {
			expect(RADIO_LABEL_TEXT_SIZE[size]).toBeTruthy();
		}
	});

	test("grows with the radio", () => {
		const steps = RADIO_SIZES.map((size) => TEXT_SIZES.indexOf(RADIO_LABEL_TEXT_SIZE[size]));
		expect(steps.every((step) => step >= 0)).toBe(true);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});
});

describe("RADIO_DOT_SPRING", () => {
	// A zero mass hangs the UI thread, and a critically damped spring never
	// overshoots — which is the whole reason to use one rather than a timing.
	test("describes a spring that actually springs", () => {
		expect(RADIO_DOT_SPRING.mass).toBeGreaterThan(0);
		expect(RADIO_DOT_SPRING.stiffness).toBeGreaterThan(0);
		expect(RADIO_DOT_SPRING.damping).toBeGreaterThan(0);
		const critical = 2 * Math.sqrt(RADIO_DOT_SPRING.stiffness * RADIO_DOT_SPRING.mass);
		expect(RADIO_DOT_SPRING.damping).toBeLessThan(critical);
	});
});

describe("resolveRadioState, ungrouped", () => {
	test("takes its own axes, and the defaults when it names none", () => {
		expect(resolveRadioState({})).toEqual({
			size: RADIO_DEFAULT_SIZE,
			variant: RADIO_DEFAULT_VARIANT,
			isSelected: false,
			isDisabled: false,
			isInvalid: false,
			isGrouped: false,
		});
		expect(resolveRadioState({ own: { size: "lg", variant: "secondary" } })).toMatchObject({
			size: "lg",
			variant: "secondary",
		});
	});

	test("reads selection from its own prop", () => {
		expect(resolveRadioState({ own: { isSelected: true } }).isSelected).toBe(true);
		expect(resolveRadioState({ own: { isSelected: false } }).isSelected).toBe(false);
	});

	// Without a group there is nothing for a value to identify it to.
	test("ignores a value", () => {
		expect(resolveRadioState({ own: { value: "a" } }).isSelected).toBe(false);
	});

	test("reports itself ungrouped", () => {
		expect(resolveRadioState({ own: { isSelected: true } }).isGrouped).toBe(false);
	});
});

describe("resolveRadioState, grouped", () => {
	const group = { selected: "a", size: "lg", variant: "secondary" } as const;

	test("is selected only when the group names its value", () => {
		expect(resolveRadioState({ group, own: { value: "a" } }).isSelected).toBe(true);
		expect(resolveRadioState({ group, own: { value: "b" } }).isSelected).toBe(false);
	});

	// A radio in a group with no value can never be selected. The dev warning
	// for that lives in radio.tsx, where the component can be named.
	test("is never selected without a value, even against an empty group", () => {
		expect(resolveRadioState({ group, own: {} }).isSelected).toBe(false);
		expect(resolveRadioState({ group: { ...group, selected: null }, own: {} }).isSelected).toBe(false);
	});

	// One box, one set of axes. A group whose options were different sizes is
	// not a design — the call `Input` makes inside an `Input.Group`.
	test("takes the group's size and variant over its own", () => {
		for (const size of RADIO_SIZES) {
			for (const variant of RADIO_VARIANTS) {
				const state = resolveRadioState({ group, own: { size, variant } });
				expect(state.size).toBe(group.size);
				expect(state.variant).toBe(group.variant);
			}
		}
	});

	test("ignores its own isSelected", () => {
		expect(resolveRadioState({ group, own: { value: "b", isSelected: true } }).isSelected).toBe(false);
	});

	test("reports itself grouped, even when the group has no selection", () => {
		expect(resolveRadioState({ group: { ...group, selected: null } }).isGrouped).toBe(true);
	});
});

// Nearest wins: the group first, the radio's own prop next, an enclosing Field
// last. Swept as a table so the precedence is a property rather than an anecdote.
describe("resolveRadioState, the state ladder", () => {
	const SOURCES = [undefined, true, false] as const;

	for (const axis of ["isDisabled", "isInvalid"] as const) {
		test(`resolves ${axis} nearest-first across all twenty-seven combinations`, () => {
			for (const inGroup of SOURCES) {
				for (const inOwn of SOURCES) {
					for (const inField of SOURCES) {
						const state = resolveRadioState({
							group: { selected: null, size: "md", variant: "primary", [axis]: inGroup },
							own: { [axis]: inOwn },
							field: { [axis]: inField },
						});
						expect(state[axis]).toBe(inGroup ?? inOwn ?? inField ?? false);
					}
				}
			}
		});
	}

	test("a radio opts out of an invalid Field", () => {
		expect(resolveRadioState({ own: { isInvalid: false }, field: { isInvalid: true } }).isInvalid).toBe(false);
		expect(resolveRadioState({ field: { isInvalid: true } }).isInvalid).toBe(true);
	});

	// The one place this differs from Input.Group, and the reason the group
	// publishes its state axes raw: a group holds many radios, so disabling one
	// option out of five has to be possible.
	test("a group that names nothing lets one option disable itself", () => {
		const group = { selected: null, size: "md", variant: "primary" } as const;
		expect(resolveRadioState({ group, own: { isDisabled: true } }).isDisabled).toBe(true);
	});

	test("a group that disables everything cannot be escaped", () => {
		const group = { selected: null, size: "md", variant: "primary", isDisabled: true } as const;
		expect(resolveRadioState({ group, own: { isDisabled: false } }).isDisabled).toBe(true);
	});
});

describe("shouldEmitSelection", () => {
	test("reports a real change", () => {
		expect(shouldEmitSelection(null, "a")).toBe(true);
		expect(shouldEmitSelection("a", "b")).toBe(true);
	});

	// Re-picking the selected option is not a change, and a radio group has no
	// deselect gesture. HTML's own radio does not fire `change` here either.
	test("stays quiet when the option is already selected", () => {
		expect(shouldEmitSelection("a", "a")).toBe(false);
	});
});
