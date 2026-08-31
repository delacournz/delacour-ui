import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { declarationCount } from "../../styles/theme-tokens.test";
import { ICON_SIZES } from "../icon/icon.variants";
import {
	ACCORDION_CONTENT_FADE,
	ACCORDION_DEFAULT_SIZE,
	ACCORDION_DEFAULT_VARIANT,
	ACCORDION_FOREGROUND_TOKEN,
	ACCORDION_GLYPH_STEP,
	ACCORDION_INDICATOR_ROTATION,
	ACCORDION_INDICATOR_TOKEN,
	ACCORDION_SELECTION_MODES,
	ACCORDION_SIZES,
	ACCORDION_SPRING,
	ACCORDION_UNMEASURED,
	ACCORDION_VARIANTS,
	accordionVariants,
	isItemExpanded,
	resolveAccordionItemAxes,
	toExpandedList,
	toggleExpandedValue,
} from "./accordion.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");

/** The minimum a touch target may be, in points. Apple's number, and Android's. */
const MINIMUM_TARGET = 44;

/** Tailwind's spacing step, in points — `min-h-12` is twelve of them. */
const SPACING_STEP = 4;

/** A `--spacing-*` token's value in points, read from `tokens.css`. */
function spacingPx(token: string): number {
	const match = TOKENS_CSS.match(new RegExp(`--spacing-${token}:\\s*(\\d+)px`));
	if (!match) throw new Error(`tokens.css declares no --spacing-${token}`);
	return Number(match[1]);
}

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * A slot that emits nothing returns `undefined` rather than `""` — correct, but
 * it makes a bare `not.toMatch()` throw rather than pass.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The points a `px-4` / `min-h-14` / `mx-3` utility resolves to. */
function utilityPx(value: string, prefix: string): number {
	const match = value.match(new RegExp(`\\b${prefix}-(\\d+(?:\\.\\d+)?)\\b`));
	if (!match) throw new Error(`no \`${prefix}-*\` in "${value}"`);
	return Number(match[1]) * SPACING_STEP;
}

/** Every slot for one size, at the default variant, enabled. */
function slotsFor(size: (typeof ACCORDION_SIZES)[number]) {
	return accordionVariants({ isDisabled: false, size, variant: ACCORDION_DEFAULT_VARIANT });
}

/** Every slot a `View` wears, for one size. A `Text` slot carries a treatment on purpose. */
function viewSlots(size: (typeof ACCORDION_SIZES)[number]): string[] {
	const slots = slotsFor(size);
	return [
		cls(slots.root()),
		cls(slots.item()),
		cls(slots.trigger()),
		cls(slots.triggerContent()),
		cls(slots.indicator()),
		cls(slots.content()),
		cls(slots.contentInner()),
	];
}

describe("toggleExpandedValue — single", () => {
	test("tapping a closed item opens it and closes the other", () => {
		expect(toggleExpandedValue({ expanded: ["a"], isCollapsible: true, selectionMode: "single", value: "b" })).toEqual([
			"b",
		]);
	});

	test("tapping the open one closes it while collapsible", () => {
		expect(toggleExpandedValue({ expanded: ["a"], isCollapsible: true, selectionMode: "single", value: "a" })).toEqual(
			[]
		);
	});

	test("tapping the open one is refused while not collapsible", () => {
		// Refused, and refused by *identity*: the root skips a transition that
		// returned its own input, so a rejected tap never re-renders and never
		// reports an `onValueChange` for a change that did not happen.
		const expanded = ["a"];
		expect(toggleExpandedValue({ expanded, isCollapsible: false, selectionMode: "single", value: "a" })).toBe(expanded);
	});

	test("tapping a closed one still opens it while not collapsible", () => {
		expect(toggleExpandedValue({ expanded: ["a"], isCollapsible: false, selectionMode: "single", value: "b" })).toEqual(
			["b"]
		);
	});
});

describe("toggleExpandedValue — multiple", () => {
	test("tapping a closed item appends it, leaving the rest open", () => {
		expect(
			toggleExpandedValue({ expanded: ["a"], isCollapsible: true, selectionMode: "multiple", value: "b" })
		).toEqual(["a", "b"]);
	});

	test("tapping an open item removes it", () => {
		expect(
			toggleExpandedValue({ expanded: ["a", "b"], isCollapsible: true, selectionMode: "multiple", value: "a" })
		).toEqual(["b"]);
	});

	test("an item still closes while not collapsible, as long as another stays open", () => {
		// The one this component exists to get right. `isCollapsible` bounds the
		// *set*, never a single item — a multiple accordion where nothing can ever
		// be closed again is add-only, not "keep one open".
		expect(
			toggleExpandedValue({ expanded: ["a", "b"], isCollapsible: false, selectionMode: "multiple", value: "a" })
		).toEqual(["b"]);
	});

	test("the last open item is refused while not collapsible", () => {
		const expanded = ["a"];
		expect(toggleExpandedValue({ expanded, isCollapsible: false, selectionMode: "multiple", value: "a" })).toBe(
			expanded
		);
	});

	test("opening from empty works while not collapsible", () => {
		expect(toggleExpandedValue({ expanded: [], isCollapsible: false, selectionMode: "multiple", value: "a" })).toEqual([
			"a",
		]);
	});
});

describe("toggleExpandedValue — invariants", () => {
	test("it never mutates its input", () => {
		for (const selectionMode of ACCORDION_SELECTION_MODES) {
			for (const isCollapsible of [true, false]) {
				const expanded = ["a", "b"];
				toggleExpandedValue({ expanded, isCollapsible, selectionMode, value: "a" });
				toggleExpandedValue({ expanded, isCollapsible, selectionMode, value: "c" });
				expect(expanded).toEqual(["a", "b"]);
			}
		}
	});

	test("a real change is always a new array", () => {
		// React bails out of a re-render on an unchanged reference, so a mutation
		// would flip the state while leaving the screen alone. `toggleCheckedValue`
		// carries the same rule.
		for (const selectionMode of ACCORDION_SELECTION_MODES) {
			const expanded = ["a"];
			const next = toggleExpandedValue({ expanded, isCollapsible: true, selectionMode, value: "b" });
			expect(next).not.toBe(expanded);
		}
	});

	test("an item is never listed twice", () => {
		for (const selectionMode of ACCORDION_SELECTION_MODES) {
			for (const isCollapsible of [true, false]) {
				const next = toggleExpandedValue({ expanded: ["a"], isCollapsible, selectionMode, value: "a" });
				const again = toggleExpandedValue({ expanded: next, isCollapsible, selectionMode, value: "a" });
				expect(new Set(again).size).toBe(again.length);
			}
		}
	});
});

describe("isItemExpanded", () => {
	test("it reads membership, in either mode", () => {
		expect(isItemExpanded(["a", "b"], "b")).toBe(true);
		expect(isItemExpanded(["a"], "b")).toBe(false);
		expect(isItemExpanded([], "a")).toBe(false);
	});
});

describe("toExpandedList", () => {
	test("it normalises every shape a caller can pass to one list", () => {
		// The root holds one internal `string[]` whichever mode is in play, because
		// `useControllableState` cannot be called conditionally.
		expect(toExpandedList("a")).toEqual(["a"]);
		expect(toExpandedList(["a", "b"])).toEqual(["a", "b"]);
		expect(toExpandedList(null)).toEqual([]);
		expect(toExpandedList(undefined)).toEqual([]);
	});

	test("it copies rather than aliasing the caller's array", () => {
		const value = ["a"];
		expect(toExpandedList(value)).not.toBe(value);
	});
});

describe("resolveAccordionItemAxes", () => {
	test("the item's own answer wins, then the accordion's, then off", () => {
		expect(resolveAccordionItemAxes({}).isDisabled).toBe(false);
		expect(resolveAccordionItemAxes({ root: { isDisabled: true } }).isDisabled).toBe(true);
		expect(resolveAccordionItemAxes({ own: { isDisabled: true }, root: { isDisabled: false } }).isDisabled).toBe(true);
	});

	test("an explicit false opts one item out of a disabled accordion", () => {
		// `??` throughout and never `||`, so `false` is a value rather than an
		// absence — the rule `pressedScale` already follows.
		expect(resolveAccordionItemAxes({ own: { isDisabled: false }, root: { isDisabled: true } }).isDisabled).toBe(false);
	});
});

describe("accordionVariants defaults", () => {
	test("the tv's defaults are the constants the component falls back to", () => {
		// A drift between the two is an accordion that renders at one size and
		// reports another, which nothing on screen would reveal.
		expect(cls(accordionVariants({}).trigger())).toBe(cls(slotsFor(ACCORDION_DEFAULT_SIZE).trigger()));
		expect(cls(accordionVariants({}).root())).toBe(
			cls(accordionVariants({ size: ACCORDION_DEFAULT_SIZE, variant: ACCORDION_DEFAULT_VARIANT }).root())
		);
		expect(ACCORDION_SIZES).toContain(ACCORDION_DEFAULT_SIZE);
		expect(ACCORDION_VARIANTS).toContain(ACCORDION_DEFAULT_VARIANT);
	});
});

describe("accordionVariants geometry", () => {
	test("the divider is inset to the trigger's own padding at every size", () => {
		// As a pair, which is what `ListGroup` pins for the same reason: a retune of
		// the row's padding that left the divider behind is a line that no longer
		// lines up with anything, at one size only.
		for (const size of ACCORDION_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.divider()), "mx")).toBe(utilityPx(cls(slots.trigger()), "px"));
		}
	});

	test("the content is inset to the trigger's padding too", () => {
		// A panel whose text started at a different margin than the title above it
		// reads as two columns rather than one disclosure.
		for (const size of ACCORDION_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.contentInner()), "px")).toBe(utilityPx(cls(slots.trigger()), "px"));
		}
	});

	test("a trigger is a real touch target at every size", () => {
		for (const size of ACCORDION_SIZES) {
			expect(utilityPx(cls(slotsFor(size).trigger()), "min-h")).toBeGreaterThanOrEqual(MINIMUM_TARGET);
		}
	});

	test("the size ladder ascends", () => {
		const heights = ACCORDION_SIZES.map((size) => utilityPx(cls(slotsFor(size).trigger()), "min-h"));
		expect(heights).toEqual([...heights].sort((a, b) => a - b));
		expect(new Set(heights).size).toBe(heights.length);
	});

	test("every glyph step is a size the icon scale has", () => {
		// A glyph in an accordion is a mark on the shared scale, like every other
		// glyph in the library — not a private number.
		for (const size of ACCORDION_SIZES) {
			const step = ACCORDION_GLYPH_STEP[size];
			expect(ICON_SIZES).toContain(step);
			expect(cls(slotsFor(size).glyph())).toBe(`size-icon-${step}`);
			expect(spacingPx(`icon-${step}`)).toBeGreaterThan(0);
		}
	});
});

describe("accordionVariants slots", () => {
	test("no slot a View wears carries a text treatment", () => {
		// A React Native View does not cascade colour to a Text descendant, so the
		// treatment lives on the title and description slots. Rule 1.
		for (const size of ACCORDION_SIZES) {
			for (const value of viewSlots(size)) {
				expect(value).not.toMatch(/\b(text|font)-/);
			}
		}
	});

	test("the title and description carry the treatment instead", () => {
		for (const size of ACCORDION_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.title())).toMatch(/\btext-/);
			expect(cls(slots.description())).toMatch(/\btext-/);
		}
	});

	test("the text ladder ascends with the size", () => {
		const scale = ["text-xs", "text-sm", "text-base", "text-lg"];
		const steps = ACCORDION_SIZES.map((size) => {
			const title = cls(slotsFor(size).title());
			return scale.findIndex((step) => new RegExp(`\\b${step}\\b`).test(title));
		});
		expect(steps).not.toContain(-1);
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
	});

	test("the root clips", () => {
		// Load-bearing rather than tidiness: an expanding panel would otherwise
		// square off the group's own rounded corners — `ListGroup`'s rule.
		for (const size of ACCORDION_SIZES) {
			expect(cls(slotsFor(size).root())).toMatch(/\boverflow-hidden\b/);
		}
	});

	test("the content clips, because its height is animated below its content's", () => {
		for (const size of ACCORDION_SIZES) {
			expect(cls(slotsFor(size).content())).toMatch(/\boverflow-hidden\b/);
		}
	});

	test("the measured layer is out of flow and spans the width", () => {
		// In normal flow it is laid out against the clip's own height, so a panel
		// measured while the clip sits at zero reports its padding and nothing else —
		// sixteen points for a paragraph, on a simulator. Out of flow it reports its
		// content. `left-0 right-0` is the other half: an absolute child is
		// content-width without it, and a paragraph would measure as one long line.
		for (const size of ACCORDION_SIZES) {
			const inner = cls(slotsFor(size).contentInner());
			expect(inner).toMatch(/\babsolute\b/);
			expect(inner).toMatch(/\btop-0\b/);
			expect(inner).toMatch(/\bleft-0\b/);
			expect(inner).toMatch(/\bright-0\b/);
		}
	});

	test("the trigger spans the group it is clipped by", () => {
		// The root clips, so without this a short trigger leaves the press feedback
		// ending mid-card instead of spanning it — `ListGroup.Item`'s rule.
		for (const size of ACCORDION_SIZES) {
			expect(cls(slotsFor(size).trigger())).toMatch(/\bw-full\b/);
		}
	});

	test("the trigger's text column can shrink", () => {
		// Without `min-w-0` a long title pushes the indicator off the row rather
		// than truncating, because a flex item's default minimum is its content.
		for (const size of ACCORDION_SIZES) {
			const content = cls(slotsFor(size).triggerContent());
			expect(content).toMatch(/\bflex-1\b/);
			expect(content).toMatch(/\bmin-w-0\b/);
		}
	});

	test("the disabled fade lands on the item, never on the trigger", () => {
		// The trigger is a `Pressable`, whose root Animated.View writes `opacity`
		// every frame through a useAnimatedStyle of its own. A class on that node
		// is overwritten silently — the failure `Switch` and `Radio` both record.
		for (const size of ACCORDION_SIZES) {
			const slots = accordionVariants({ isDisabled: true, size, variant: ACCORDION_DEFAULT_VARIANT });
			expect(cls(slots.item())).toMatch(/\bopacity-50\b/);
			expect(cls(slots.trigger())).not.toMatch(/\bopacity-/);
		}
	});

	test("every variant paints a distinct root", () => {
		// Two cells collapsing means a caller can set the axis and see nothing
		// change, which reads as the prop being ignored.
		const roots = ACCORDION_VARIANTS.map((variant) =>
			cls(accordionVariants({ isDisabled: false, size: ACCORDION_DEFAULT_SIZE, variant }).root())
		);
		expect(new Set(roots).size).toBe(roots.length);
	});

	test("the variant paints the root alone", () => {
		// Only the root has a surface. A trigger or a panel that also changed with
		// the variant would be a second source for one colour.
		for (const variant of ACCORDION_VARIANTS) {
			const slots = accordionVariants({ isDisabled: false, size: ACCORDION_DEFAULT_SIZE, variant });
			expect(cls(slots.trigger())).toBe(cls(slotsFor(ACCORDION_DEFAULT_SIZE).trigger()));
			expect(cls(slots.contentInner())).toBe(cls(slotsFor(ACCORDION_DEFAULT_SIZE).contentInner()));
		}
	});

	test("nothing draws a shadow", () => {
		// Nothing else in this package does, and React Native's shadow props
		// diverge between platforms in a way a flat fill does not.
		for (const size of ACCORDION_SIZES) {
			for (const value of viewSlots(size)) {
				expect(value).not.toMatch(/\bshadow/);
			}
		}
	});
});

describe("accordion colour tokens", () => {
	test("every token it names is declared in both themes", () => {
		// A token no theme emits resolves to undefined and is dropped silently,
		// leaving the platform default in place with no error anywhere.
		for (const token of [ACCORDION_FOREGROUND_TOKEN, ACCORDION_INDICATOR_TOKEN]) {
			expect(declarationCount(token)).toBe(2);
		}
	});

	test("the indicator is quieter than the title beside it", () => {
		// The chevron is chrome; the title is the content. Painting both `foreground`
		// would give the glyph the same weight as the words it points at.
		expect(ACCORDION_INDICATOR_TOKEN).not.toBe(ACCORDION_FOREGROUND_TOKEN);
	});
});

describe("accordion animation", () => {
	test("the panel settles without overshooting its own measured height", () => {
		// Critically damped, and this is `Switch`'s rule turned inside out: an
		// overshoot in *height* draws the panel taller than its content measured,
		// flashing the surface behind it for a frame at the end of every expand.
		const ratio = ACCORDION_SPRING.damping / (2 * Math.sqrt(ACCORDION_SPRING.stiffness * ACCORDION_SPRING.mass));
		expect(ratio).toBeGreaterThanOrEqual(1);
		// And not so far past it that the panel crawls open.
		expect(ratio).toBeLessThan(2);
	});

	test("unmeasured is a height no layout can report", () => {
		// Zero is a real answer — a panel whose content rendered nothing — so only a
		// negative can mean "still waiting". An item that conflated the two would
		// never start its spring for an empty panel.
		expect(ACCORDION_UNMEASURED).toBeLessThan(0);
	});

	test("the indicator turns a half turn", () => {
		const { collapsed, expanded } = ACCORDION_INDICATOR_ROTATION;
		expect(Math.abs(expanded - collapsed)).toBe(180);
	});

	test("the fade runs ahead of the height, inside the travel", () => {
		// A panel whose opacity tracked its height linearly would be half
		// transparent at the midpoint of every expand. The window closes before the
		// height does, so the content is legible for most of the travel.
		const { start, end } = ACCORDION_CONTENT_FADE;
		expect(start).toBeGreaterThanOrEqual(0);
		expect(end).toBeGreaterThan(start);
		expect(end).toBeLessThan(1);
	});
});
