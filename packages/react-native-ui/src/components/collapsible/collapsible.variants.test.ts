import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { declarationCount } from "../../styles/theme-tokens.test";
import {
	ACCORDION_CONTENT_FADE,
	ACCORDION_GLYPH_STEP,
	ACCORDION_INDICATOR_ROTATION,
	ACCORDION_SIZES,
	ACCORDION_SPRING,
	ACCORDION_VARIANTS,
	accordionVariants,
} from "../accordion/accordion.variants";
import { ICON_SIZES } from "../icon/icon.variants";
import {
	COLLAPSIBLE_CONTENT_FADE,
	COLLAPSIBLE_DEFAULT_SIZE,
	COLLAPSIBLE_DEFAULT_VARIANT,
	COLLAPSIBLE_FOREGROUND_TOKEN,
	COLLAPSIBLE_GLYPH_STEP,
	COLLAPSIBLE_INDICATOR_ROTATION,
	COLLAPSIBLE_INDICATOR_TOKEN,
	COLLAPSIBLE_SIZES,
	COLLAPSIBLE_SPRING,
	COLLAPSIBLE_UNMEASURED,
	COLLAPSIBLE_VARIANTS,
	collapsibleVariants,
	resolveCollapsibleAccessibility,
	toggleCollapsibleOpen,
} from "./collapsible.variants";

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

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The points a `px-4` / `min-h-14` utility resolves to. */
function utilityPx(value: string, prefix: string): number {
	const match = value.match(new RegExp(`\\b${prefix}-(\\d+(?:\\.\\d+)?)\\b`));
	if (!match) throw new Error(`no \`${prefix}-*\` in "${value}"`);
	return Number(match[1]) * SPACING_STEP;
}

type Size = (typeof COLLAPSIBLE_SIZES)[number];

/** Every slot for one size, at the default variant, enabled. */
function slotsFor(size: Size) {
	return collapsibleVariants({ isDisabled: false, size, variant: COLLAPSIBLE_DEFAULT_VARIANT });
}

/** Every slot a `View` wears, for one size. A `Text` slot carries a treatment on purpose. */
function viewSlots(size: Size): string[] {
	const slots = slotsFor(size);
	return [
		cls(slots.root()),
		cls(slots.trigger()),
		cls(slots.triggerContent()),
		cls(slots.indicator()),
		cls(slots.content()),
		cls(slots.contentInner()),
	];
}

describe("toggleCollapsibleOpen", () => {
	test("a tap flips the state", () => {
		expect(toggleCollapsibleOpen({ isDisabled: false, isOpen: false })).toBe(true);
		expect(toggleCollapsibleOpen({ isDisabled: false, isOpen: true })).toBe(false);
	});

	test("a disabled collapsible refuses the tap in both directions", () => {
		// Disabled means the control cannot be used, not that it undoes itself: an
		// open section stays open, and a closed one stays closed.
		expect(toggleCollapsibleOpen({ isDisabled: true, isOpen: false })).toBe(false);
		expect(toggleCollapsibleOpen({ isDisabled: true, isOpen: true })).toBe(true);
	});
});

describe("resolveCollapsibleAccessibility", () => {
	test("the trigger announces expanded and disabled from the settled state", () => {
		expect(resolveCollapsibleAccessibility({ isDisabled: false, isOpen: true })).toEqual({
			trigger: { disabled: false, expanded: true },
			content: { accessibilityElementsHidden: false, importantForAccessibility: "auto" },
		});
	});

	test("a closed panel is taken out of the accessibility tree", () => {
		// The panel stays mounted after its first expand, so without this a screen
		// reader would read out a section that is not on screen.
		expect(resolveCollapsibleAccessibility({ isDisabled: false, isOpen: false }).content).toEqual({
			accessibilityElementsHidden: true,
			importantForAccessibility: "no-hide-descendants",
		});
	});

	test("disabling a section does not hide it", () => {
		// An open, disabled section is still content on screen.
		const resolved = resolveCollapsibleAccessibility({ isDisabled: true, isOpen: true });
		expect(resolved.trigger.disabled).toBe(true);
		expect(resolved.content.accessibilityElementsHidden).toBe(false);
	});
});

describe("collapsibleVariants defaults", () => {
	test("the tv's defaults are the constants the component falls back to", () => {
		expect(cls(collapsibleVariants({}).trigger())).toBe(cls(slotsFor(COLLAPSIBLE_DEFAULT_SIZE).trigger()));
		expect(cls(collapsibleVariants({}).root())).toBe(
			cls(collapsibleVariants({ size: COLLAPSIBLE_DEFAULT_SIZE, variant: COLLAPSIBLE_DEFAULT_VARIANT }).root())
		);
		expect(COLLAPSIBLE_SIZES).toContain(COLLAPSIBLE_DEFAULT_SIZE);
		expect(COLLAPSIBLE_VARIANTS).toContain(COLLAPSIBLE_DEFAULT_VARIANT);
	});
});

describe("collapsibleVariants geometry", () => {
	test("the content is inset to the trigger's padding at every size", () => {
		// A panel whose text started at a different margin than the title above it
		// reads as two columns rather than one disclosure.
		for (const size of COLLAPSIBLE_SIZES) {
			const slots = slotsFor(size);
			expect(utilityPx(cls(slots.contentInner()), "px")).toBe(utilityPx(cls(slots.trigger()), "px"));
		}
	});

	test("a trigger is a real touch target at every size", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			expect(utilityPx(cls(slotsFor(size).trigger()), "min-h")).toBeGreaterThanOrEqual(MINIMUM_TARGET);
		}
	});

	test("the size ladder ascends", () => {
		const heights = COLLAPSIBLE_SIZES.map((size) => utilityPx(cls(slotsFor(size).trigger()), "min-h"));
		expect(heights).toEqual([...heights].sort((a, b) => a - b));
		expect(new Set(heights).size).toBe(heights.length);
	});

	test("every glyph step is a size the icon scale has", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			const step = COLLAPSIBLE_GLYPH_STEP[size];
			expect(ICON_SIZES).toContain(step);
			expect(cls(slotsFor(size).glyph())).toBe(`size-icon-${step}`);
			expect(spacingPx(`icon-${step}`)).toBeGreaterThan(0);
		}
	});
});

describe("collapsibleVariants slots", () => {
	test("no slot a View wears carries a text treatment", () => {
		// A React Native View does not cascade colour to a Text descendant. Rule 1.
		for (const size of COLLAPSIBLE_SIZES) {
			for (const value of viewSlots(size)) {
				expect(value).not.toMatch(/\b(text|font)-/);
			}
		}
	});

	test("the title and description carry the treatment instead", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.title())).toMatch(/\btext-/);
			expect(cls(slots.description())).toMatch(/\btext-/);
		}
	});

	test("the root clips, so an expanding panel keeps the rounded corners", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			expect(cls(slotsFor(size).root())).toMatch(/\boverflow-hidden\b/);
		}
	});

	test("the content clips, because its height is animated below its content's", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			expect(cls(slotsFor(size).content())).toMatch(/\boverflow-hidden\b/);
		}
	});

	test("the measured layer is out of flow and spans the width", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			const inner = cls(slotsFor(size).contentInner());
			for (const utility of ["absolute", "top-0", "left-0", "right-0"]) {
				expect(inner).toMatch(new RegExp(`\\b${utility}\\b`));
			}
		}
	});

	test("the trigger spans the surface and its text column can shrink", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			const slots = slotsFor(size);
			expect(cls(slots.trigger())).toMatch(/\bw-full\b/);
			expect(cls(slots.triggerContent())).toMatch(/\bflex-1\b/);
			expect(cls(slots.triggerContent())).toMatch(/\bmin-w-0\b/);
		}
	});

	test("the disabled fade lands on the root, never on the trigger", () => {
		// The trigger is a `Pressable`, whose root Animated.View writes `opacity`
		// every frame — a class there is overwritten silently.
		for (const size of COLLAPSIBLE_SIZES) {
			const slots = collapsibleVariants({ isDisabled: true, size, variant: COLLAPSIBLE_DEFAULT_VARIANT });
			expect(cls(slots.root())).toMatch(/\bopacity-50\b/);
			expect(cls(slots.trigger())).not.toMatch(/\bopacity-/);
		}
	});

	test("every variant paints a distinct root, and nothing else", () => {
		const roots = COLLAPSIBLE_VARIANTS.map((variant) =>
			cls(collapsibleVariants({ isDisabled: false, size: COLLAPSIBLE_DEFAULT_SIZE, variant }).root())
		);
		expect(new Set(roots).size).toBe(roots.length);
		for (const variant of COLLAPSIBLE_VARIANTS) {
			const slots = collapsibleVariants({ isDisabled: false, size: COLLAPSIBLE_DEFAULT_SIZE, variant });
			expect(cls(slots.trigger())).toBe(cls(slotsFor(COLLAPSIBLE_DEFAULT_SIZE).trigger()));
			expect(cls(slots.contentInner())).toBe(cls(slotsFor(COLLAPSIBLE_DEFAULT_SIZE).contentInner()));
		}
	});

	test("nothing draws a shadow", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			for (const value of viewSlots(size)) {
				expect(value).not.toMatch(/\bshadow/);
			}
		}
	});
});

describe("collapsible colour tokens", () => {
	test("every token it names is declared in both themes", () => {
		for (const token of [COLLAPSIBLE_FOREGROUND_TOKEN, COLLAPSIBLE_INDICATOR_TOKEN]) {
			expect(declarationCount(token)).toBe(2);
		}
	});

	test("the indicator is quieter than the title beside it", () => {
		expect(COLLAPSIBLE_INDICATOR_TOKEN).not.toBe(COLLAPSIBLE_FOREGROUND_TOKEN);
	});
});

describe("collapsible animation", () => {
	test("the panel settles without overshooting its own measured height", () => {
		const ratio = COLLAPSIBLE_SPRING.damping / (2 * Math.sqrt(COLLAPSIBLE_SPRING.stiffness * COLLAPSIBLE_SPRING.mass));
		expect(ratio).toBeGreaterThanOrEqual(1);
		expect(ratio).toBeLessThan(2);
	});

	test("unmeasured is a height no layout can report", () => {
		expect(COLLAPSIBLE_UNMEASURED).toBeLessThan(0);
	});

	test("the fade runs ahead of the height, inside the travel", () => {
		const { start, end } = COLLAPSIBLE_CONTENT_FADE;
		expect(start).toBeGreaterThanOrEqual(0);
		expect(end).toBeGreaterThan(start);
		expect(end).toBeLessThan(1);
	});
});

describe("collapsible and accordion move alike", () => {
	// Restated rather than imported, so `delacour add collapsible` does not copy an
	// accordion in with it — and pinned here, so the two disclosures on one screen
	// cannot drift apart in feel, metrics or paint.
	test("the same spring, fade and indicator travel", () => {
		expect(COLLAPSIBLE_SPRING).toEqual(ACCORDION_SPRING);
		expect(COLLAPSIBLE_CONTENT_FADE).toEqual(ACCORDION_CONTENT_FADE);
		expect(COLLAPSIBLE_INDICATOR_ROTATION).toEqual(ACCORDION_INDICATOR_ROTATION);
	});

	test("the same axes", () => {
		expect([...COLLAPSIBLE_VARIANTS]).toEqual([...ACCORDION_VARIANTS]);
		expect([...COLLAPSIBLE_SIZES]).toEqual([...ACCORDION_SIZES]);
		expect(COLLAPSIBLE_GLYPH_STEP).toEqual(ACCORDION_GLYPH_STEP);
	});

	test("the same trigger, panel and surface at every size and variant", () => {
		for (const size of COLLAPSIBLE_SIZES) {
			const own = slotsFor(size);
			const accordion = accordionVariants({ isDisabled: false, size, variant: "default" });
			expect(cls(own.trigger())).toBe(cls(accordion.trigger()));
			expect(cls(own.contentInner())).toBe(cls(accordion.contentInner()));
			expect(cls(own.title())).toBe(cls(accordion.title()));
			expect(cls(own.description())).toBe(cls(accordion.description()));
		}
		for (const variant of COLLAPSIBLE_VARIANTS) {
			const own = collapsibleVariants({ isDisabled: false, size: COLLAPSIBLE_DEFAULT_SIZE, variant });
			const accordion = accordionVariants({ isDisabled: false, size: COLLAPSIBLE_DEFAULT_SIZE, variant });
			expect(cls(own.root())).toBe(cls(accordion.root()));
		}
	});
});
