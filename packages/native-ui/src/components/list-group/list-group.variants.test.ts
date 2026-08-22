import { describe, expect, test } from "bun:test";
import {
	LIST_GROUP_ICON_SIZE,
	LIST_GROUP_ITEM_FEEDBACK,
	LIST_GROUP_ITEM_FEEDBACKS,
	LIST_GROUP_SIZES,
	LIST_GROUP_SUFFIX_ICON_SIZE,
	LIST_GROUP_VARIANTS,
	listGroupDividerVariants,
	listGroupItemContentVariants,
	listGroupItemDescriptionVariants,
	listGroupItemTitleVariants,
	listGroupItemVariants,
	listGroupVariants,
} from "./list-group.variants";

/** Pulls the horizontal padding step out of a class string — `px-4` yields 4. */
function paddingStep(cls: string): string | undefined {
	return cls.match(/\bpx-(\d+(?:\.\d+)?)\b/)?.[1];
}

/** Pulls the horizontal margin step out of a class string — `mx-4` yields 4. */
function marginStep(cls: string): string | undefined {
	return cls.match(/\bmx-(\d+(?:\.\d+)?)\b/)?.[1];
}

describe("listGroupVariants", () => {
	test("defaults to the card surface at md", () => {
		const cls = listGroupVariants();
		expect(cls).toContain("bg-card");
		expect(cls).toContain("border-border");
	});

	test("gives every variant a distinct surface", () => {
		const seen = new Set(LIST_GROUP_VARIANTS.map((variant) => listGroupVariants({ variant })));
		expect(seen.size).toBe(LIST_GROUP_VARIANTS.length);
	});

	test("maps each variant to its surface", () => {
		expect(listGroupVariants({ variant: "default" })).toContain("bg-card");
		expect(listGroupVariants({ variant: "secondary" })).toContain("bg-secondary");
		expect(listGroupVariants({ variant: "tertiary" })).toContain("bg-tertiary");
		expect(listGroupVariants({ variant: "transparent" })).toContain("bg-transparent");
	});

	test("only the default variant draws a border", () => {
		expect(listGroupVariants({ variant: "default" })).toContain("border-border");
		for (const variant of LIST_GROUP_VARIANTS.filter((name) => name !== "default")) {
			expect(listGroupVariants({ variant })).not.toContain("border-border");
		}
	});

	// The root's radius has to clip its rows: a pressed row fades to the edge of
	// its own box, and without this the fade squares off the group's corners.
	test("clips its rows at every variant and size", () => {
		for (const variant of LIST_GROUP_VARIANTS) {
			for (const size of LIST_GROUP_SIZES) {
				const cls = listGroupVariants({ size, variant });
				expect(cls).toContain("overflow-hidden");
				expect(cls).toMatch(/\brounded-/);
			}
		}
	});

	// Rule 1: a React Native View does not cascade colour to a Text descendant,
	// so the text tokens belong on the title and description, never here.
	test("carries no text treatment", () => {
		for (const variant of LIST_GROUP_VARIANTS) {
			expect(listGroupVariants({ variant })).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(listGroupVariants({ className: "mb-6" })).toContain("mb-6");
		expect(listGroupVariants({ className: "bg-popover" })).not.toContain("bg-card");
	});
});

describe("listGroupItemVariants", () => {
	test("lays a row out horizontally across its full width", () => {
		const cls = listGroupItemVariants();
		expect(cls).toContain("flex-row");
		expect(cls).toContain("items-center");
		expect(cls).toContain("w-full");
	});

	test("gives every size a distinct row metric", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupItemVariants({ size })));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("pads and spaces every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			const cls = listGroupItemVariants({ size });
			expect(cls).toMatch(/\bmin-h-\d/);
			expect(cls).toMatch(/\bpx-\d/);
			expect(cls).toMatch(/\bpy-\d/);
			expect(cls).toMatch(/\bgap-\d/);
		}
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(listGroupItemVariants({ isDisabled: true })).toContain("opacity-50");
		expect(listGroupItemVariants({ isDisabled: false })).not.toContain("opacity-50");
	});

	// Rule 1 again — the row is a View, so the title owns its own colour.
	test("carries no text treatment", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(listGroupItemVariants({ size })).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(listGroupItemVariants({ className: "opacity-80" })).toContain("opacity-80");
	});
});

describe("listGroupDividerVariants", () => {
	// The load-bearing coupling: an auto-inserted divider is inset to line up with
	// the row's own padding. Drift between the two is what makes a grouped list
	// look wrong, so the pair is asserted together rather than pinned separately.
	test("insets the divider to the row's horizontal padding at every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			const inset = marginStep(listGroupDividerVariants({ size }));
			const padding = paddingStep(listGroupItemVariants({ size }));
			expect(inset).toBeDefined();
			expect(inset).toBe(padding);
		}
	});

	test("gives every size a distinct inset", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupDividerVariants({ size })));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	// The line itself comes from Separator; this only positions it.
	test("carries no colour of its own", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(listGroupDividerVariants({ size })).not.toMatch(/\b(bg|text|border)-/);
		}
	});
});

describe("listGroupItemContentVariants", () => {
	test("takes the space the prefix and suffix leave", () => {
		expect(listGroupItemContentVariants()).toContain("flex-1");
	});
});

describe("listGroupItemTitleVariants", () => {
	test("carries the foreground colour, which the row must not", () => {
		expect(listGroupItemTitleVariants()).toContain("text-foreground");
	});

	test("gives every size a distinct type scale", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupItemTitleVariants({ size })));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("merges an incoming className last", () => {
		expect(listGroupItemTitleVariants({ className: "font-bold" })).toContain("font-bold");
	});
});

describe("listGroupItemDescriptionVariants", () => {
	test("sits back from the title on the muted token", () => {
		expect(listGroupItemDescriptionVariants()).toContain("text-muted-foreground");
		expect(listGroupItemDescriptionVariants()).not.toContain("text-foreground");
	});

	test("gives every size a distinct type scale", () => {
		const seen = new Set(LIST_GROUP_SIZES.map((size) => listGroupItemDescriptionVariants({ size })));
		expect(seen.size).toBe(LIST_GROUP_SIZES.length);
	});

	test("stays smaller than the title it sits under", () => {
		const scale = ["text-xs", "text-sm", "text-base", "text-lg"];
		for (const size of LIST_GROUP_SIZES) {
			const title = scale.findIndex((step) => listGroupItemTitleVariants({ size }).includes(step));
			const description = scale.findIndex((step) => listGroupItemDescriptionVariants({ size }).includes(step));
			expect(description).toBeGreaterThanOrEqual(0);
			expect(description).toBeLessThan(title);
		}
	});
});

describe("LIST_GROUP_ITEM_FEEDBACK", () => {
	test("covers every named feedback", () => {
		for (const feedback of LIST_GROUP_ITEM_FEEDBACKS) {
			expect(LIST_GROUP_ITEM_FEEDBACK[feedback]).toBeDefined();
		}
	});

	// These feed Pressable's `pressedOpacity` / `pressedScale` directly, where 1
	// is the neutral value on either axis — so each mode moves exactly one of them.
	test("fade dims without scaling", () => {
		expect(LIST_GROUP_ITEM_FEEDBACK.fade.scale).toBe(1);
		expect(LIST_GROUP_ITEM_FEEDBACK.fade.opacity).toBeLessThan(1);
	});

	test("scale shrinks without dimming", () => {
		expect(LIST_GROUP_ITEM_FEEDBACK.scale.opacity).toBe(1);
		expect(LIST_GROUP_ITEM_FEEDBACK.scale.scale).toBeLessThan(1);
	});

	test("none moves neither axis", () => {
		expect(LIST_GROUP_ITEM_FEEDBACK.none).toEqual({ opacity: 1, scale: 1 });
	});

	test("every mode stays within the range Pressable interpolates over", () => {
		for (const feedback of LIST_GROUP_ITEM_FEEDBACKS) {
			const { opacity, scale } = LIST_GROUP_ITEM_FEEDBACK[feedback];
			expect(opacity).toBeGreaterThan(0);
			expect(opacity).toBeLessThanOrEqual(1);
			expect(scale).toBeGreaterThan(0);
			expect(scale).toBeLessThanOrEqual(1);
		}
	});
});

describe("LIST_GROUP_ICON_SIZE", () => {
	test("gives every size a distinct value, increasing with it", () => {
		const values = LIST_GROUP_SIZES.map((size) => LIST_GROUP_ICON_SIZE[size]);
		expect(new Set(values).size).toBe(LIST_GROUP_SIZES.length);
		expect([...values]).toEqual([...values].sort((a, b) => a - b));
	});
});

describe("LIST_GROUP_SUFFIX_ICON_SIZE", () => {
	test("gives every size a distinct value, increasing with it", () => {
		const values = LIST_GROUP_SIZES.map((size) => LIST_GROUP_SUFFIX_ICON_SIZE[size]);
		expect(new Set(values).size).toBe(LIST_GROUP_SIZES.length);
		expect([...values]).toEqual([...values].sort((a, b) => a - b));
	});

	// The trailing chevron is a hint, not content: it stays under the leading
	// icon so a row reads left to right rather than being pulled to its edge.
	test("stays smaller than the prefix icon at every size", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(LIST_GROUP_SUFFIX_ICON_SIZE[size]).toBeLessThan(LIST_GROUP_ICON_SIZE[size]);
		}
	});
});
