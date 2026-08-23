import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { LIST_GROUP_SIZES, LIST_GROUP_VARIANTS, listGroupVariants } from "./list-group.variants";

/** Pulls the horizontal padding step out of a class string — `px-4` yields 4. */
function paddingStep(cls: string): string | undefined {
	return cls.match(/\bpx-(\d+(?:\.\d+)?)\b/)?.[1];
}

/** Pulls the horizontal margin step out of a class string — `mx-4` yields 4. */
function marginStep(cls: string): string | undefined {
	return cls.match(/\bmx-(\d+(?:\.\d+)?)\b/)?.[1];
}

/**
 * Position of a class string's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so a test says what it means and
 * survives a token being retuned in `tokens.css`. `tokens.test.ts` is what
 * keeps that array ordered.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("listGroupVariants root slot", () => {
	test("defaults to the card surface at md", () => {
		const cls = listGroupVariants().root();
		expect(cls).toContain("bg-card");
		expect(cls).toContain("border-border");
	});

	test("gives every variant a distinct surface", () => {
		const seen = new Set(LIST_GROUP_VARIANTS.map((variant) => listGroupVariants({ variant }).root()));
		expect(seen.size).toBe(LIST_GROUP_VARIANTS.length);
	});

	test("maps each variant to its surface", () => {
		expect(listGroupVariants({ variant: "default" }).root()).toContain("bg-card");
		expect(listGroupVariants({ variant: "secondary" }).root()).toContain("bg-secondary");
		expect(listGroupVariants({ variant: "tertiary" }).root()).toContain("bg-tertiary");
		expect(listGroupVariants({ variant: "transparent" }).root()).toContain("bg-transparent");
	});

	test("only the default variant draws a border", () => {
		expect(listGroupVariants({ variant: "default" }).root()).toContain("border-border");
		for (const variant of LIST_GROUP_VARIANTS.filter((name) => name !== "default")) {
			expect(listGroupVariants({ variant }).root()).not.toContain("border-border");
		}
	});

	// The root's radius has to clip its rows: a pressed row fades to the edge of
	// its own box, and without this the fade squares off the group's corners.
	test("clips its rows at every variant and size", () => {
		for (const variant of LIST_GROUP_VARIANTS) {
			for (const size of LIST_GROUP_SIZES) {
				const cls = listGroupVariants({ size, variant }).root();
				expect(cls).toContain("overflow-hidden");
				expect(cls).toMatch(/\brounded-/);
			}
		}
	});

	// Rule 1: a React Native View does not cascade colour to a Text descendant,
	// so the text tokens belong on the title and description, never here.
	test("carries no text treatment", () => {
		for (const variant of LIST_GROUP_VARIANTS) {
			expect(listGroupVariants({ variant }).root()).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(listGroupVariants().root({ className: "mb-6" })).toContain("mb-6");
		expect(listGroupVariants().root({ className: "bg-popover" })).not.toContain("bg-card");
	});
});

describe("listGroupVariants item slot", () => {
	test("lays a row out horizontally across its full width", () => {
		const cls = listGroupVariants().item();
		expect(cls).toContain("flex-row");
		expect(cls).toContain("items-center");
		expect(cls).toContain("w-full");
	});

	test("gives every size a distinct row metric", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupVariants({ size }).item()));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("pads and spaces every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			const cls = listGroupVariants({ size }).item();
			expect(cls).toMatch(/\bmin-h-\d/);
			expect(cls).toMatch(/\bpx-\d/);
			expect(cls).toMatch(/\bpy-\d/);
			expect(cls).toMatch(/\bgap-\d/);
		}
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(listGroupVariants({ isDisabled: true }).item()).toContain("opacity-50");
		expect(listGroupVariants({ isDisabled: false }).item()).not.toContain("opacity-50");
	});

	// Rule 1 again — the row is a View, so the title owns its own colour.
	test("carries no text treatment", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(listGroupVariants({ size }).item()).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(listGroupVariants().item({ className: "opacity-80" })).toContain("opacity-80");
	});
});

describe("listGroupVariants divider slot", () => {
	// The load-bearing coupling: an auto-inserted divider is inset to line up with
	// the row's own padding. Drift between the two is what makes a grouped list
	// look wrong, so the pair is asserted together rather than pinned separately.
	// One slotted tv is what now makes this hard to break — both read one axis.
	test("insets the divider to the row's horizontal padding at every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			const slots = listGroupVariants({ size });
			const inset = marginStep(slots.divider());
			const padding = paddingStep(slots.item());
			expect(inset).toBeDefined();
			expect(inset).toBe(padding);
		}
	});

	test("gives every size a distinct inset", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupVariants({ size }).divider()));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	// The line itself comes from Separator; this only positions it.
	test("carries no colour of its own", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(listGroupVariants({ size }).divider()).not.toMatch(/\b(bg|text|border)-/);
		}
	});
});

describe("listGroupVariants content slot", () => {
	test("takes the space the prefix and suffix leave", () => {
		expect(listGroupVariants().content()).toContain("flex-1");
	});
});

describe("listGroupVariants title slot", () => {
	test("carries the foreground colour, which the row must not", () => {
		expect(listGroupVariants().title()).toContain("text-foreground");
	});

	test("gives every size a distinct type scale", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupVariants({ size }).title()));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("merges an incoming className last", () => {
		expect(listGroupVariants().title({ className: "font-bold" })).toContain("font-bold");
	});
});

describe("listGroupVariants description slot", () => {
	test("sits back from the title on the muted token", () => {
		expect(listGroupVariants().description()).toContain("text-muted-foreground");
		expect(listGroupVariants().description()).not.toContain("text-foreground");
	});

	test("gives every size a distinct type scale", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupVariants({ size }).description()));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("stays smaller than the title it sits under", () => {
		const scale = ["text-xs", "text-sm", "text-base", "text-lg"];
		for (const size of LIST_GROUP_SIZES) {
			const slots = listGroupVariants({ size });
			const title = scale.findIndex((step) => slots.title().includes(step));
			const description = scale.findIndex((step) => slots.description().includes(step));
			expect(description).toBeGreaterThanOrEqual(0);
			expect(description).toBeLessThan(title);
		}
	});
});

describe("listGroupVariants icon slots", () => {
	test("give every size a distinct prefix icon token, increasing with it", () => {
		const steps = LIST_GROUP_SIZES.map((size) => iconStep(listGroupVariants({ size }).prefixIcon()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(LIST_GROUP_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("give every size a distinct suffix icon token, increasing with it", () => {
		const steps = LIST_GROUP_SIZES.map((size) => iconStep(listGroupVariants({ size }).suffixIcon()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(LIST_GROUP_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// The trailing chevron is a hint, not content: it stays under the leading
	// icon so a row reads left to right rather than being pulled to its edge.
	test("keep the suffix icon smaller than the prefix icon at every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			const slots = listGroupVariants({ size });
			expect(iconStep(slots.suffixIcon())).toBeLessThan(iconStep(slots.prefixIcon()));
		}
	});

	// An icon takes a colour value rather than a class — the slot sizes it only.
	test("carry no colour", () => {
		for (const size of LIST_GROUP_SIZES) {
			const slots = listGroupVariants({ size });
			expect(slots.prefixIcon()).not.toMatch(/\b(bg|text|border)-/);
			expect(slots.suffixIcon()).not.toMatch(/\b(bg|text|border)-/);
		}
	});
});
