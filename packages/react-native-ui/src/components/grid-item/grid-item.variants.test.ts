import { describe, expect, test } from "bun:test";
import {
	GRID_ITEM_SIZES,
	GRID_ITEM_VARIANTS,
	gridItemVariants,
	joinGridItemLabel,
	resolveGridItemRender,
	resolveGridItemSize,
	resolveGridItemVariant,
} from "./grid-item.variants";

/** Every class in a slot's output, for exact membership checks. */
function classes(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

describe("tuples", () => {
	test("variants are exactly the four", () => {
		expect([...GRID_ITEM_VARIANTS]).toEqual(["default", "outline", "muted", "plain"]);
	});

	test("sizes are exactly the two", () => {
		expect([...GRID_ITEM_SIZES]).toEqual(["default", "sm"]);
	});
});

describe("gridItemVariants — variant", () => {
	const expected = {
		default: { fill: "bg-card", border: "border-border" },
		outline: { fill: "bg-transparent", border: "border-border" },
		muted: { fill: "bg-muted", border: "border-transparent" },
		plain: { fill: "bg-transparent", border: "border-transparent" },
	} as const;

	for (const variant of GRID_ITEM_VARIANTS) {
		test(`${variant} draws ${expected[variant].fill} and ${expected[variant].border}`, () => {
			const root = classes(gridItemVariants({ variant }).root());
			expect(root).toContain(expected[variant].fill);
			expect(root).toContain(expected[variant].border);
		});
	}

	// Changing variant must never move content, so the border is there in every
	// variant — only its colour changes.
	test("every variant reserves the same one-point border", () => {
		for (const variant of GRID_ITEM_VARIANTS) {
			expect(classes(gridItemVariants({ variant }).root())).toContain("border");
		}
	});

	test("every variant clips to a continuous card corner", () => {
		for (const variant of GRID_ITEM_VARIANTS) {
			const root = classes(gridItemVariants({ variant }).root());
			expect(root).toContain("rounded-lg");
			expect(root).toContain("border-continuous");
			expect(root).toContain("overflow-hidden");
		}
	});

	test("no slot casts a shadow", () => {
		for (const variant of GRID_ITEM_VARIANTS) {
			for (const size of GRID_ITEM_SIZES) {
				const slots = gridItemVariants({ isDisabled: true, size, variant });
				for (const slot of Object.values(slots)) {
					expect(slot()).not.toMatch(/\bshadow/);
				}
			}
		}
	});

	// A View does not cascade colour to a Text, so the root holding one would be
	// dead weight at best and a merge conflict at worst.
	test("the root holds no text class", () => {
		for (const variant of GRID_ITEM_VARIANTS) {
			for (const size of GRID_ITEM_SIZES) {
				expect(gridItemVariants({ size, variant }).root()).not.toMatch(/\btext-/);
			}
		}
	});
});

describe("gridItemVariants — size", () => {
	test("default pads 4 with sm titles and a 2xl tabular value", () => {
		const slots = gridItemVariants({ size: "default" });
		expect(classes(slots.root())).toContain("p-4");
		expect(classes(slots.title())).toContain("text-sm");
		const value = classes(slots.value());
		expect(value).toContain("text-2xl");
		expect(value).toContain("font-semibold");
		expect(value).toContain("tabular-nums");
		expect(classes(slots.mediaIcon())).toContain("size-icon-md");
	});

	test("sm pads 3 with xs titles and an lg value", () => {
		const slots = gridItemVariants({ size: "sm" });
		expect(classes(slots.root())).toContain("p-3");
		expect(classes(slots.title())).toContain("text-xs");
		expect(classes(slots.value())).toContain("text-lg");
		expect(classes(slots.value())).toContain("tabular-nums");
		expect(classes(slots.mediaIcon())).toContain("size-icon-sm");
	});

	test("actions sit in the corner the padding leaves", () => {
		expect(classes(gridItemVariants({ size: "default" }).actions())).toEqual(
			expect.arrayContaining(["absolute", "top-4", "end-4"])
		);
		expect(classes(gridItemVariants({ size: "sm" }).actions())).toEqual(
			expect.arrayContaining(["absolute", "top-3", "end-3"])
		);
	});
});

describe("gridItemVariants — text colour", () => {
	test("text slots carry their own colour", () => {
		const slots = gridItemVariants();
		expect(classes(slots.title())).toContain("text-foreground");
		expect(classes(slots.value())).toContain("text-foreground");
		expect(classes(slots.description())).toContain("text-muted-foreground");
	});

	test("layout slots hold no text colour", () => {
		const slots = gridItemVariants();
		for (const slot of [slots.group, slots.background, slots.media, slots.footer, slots.actions]) {
			expect(slot()).not.toMatch(/\btext-/);
		}
	});
});

describe("gridItemVariants — layout", () => {
	test("the background fills the tile behind everything and takes no touches", () => {
		const background = classes(gridItemVariants().background());
		expect(background).toContain("absolute");
		expect(background).toContain("inset-0");
	});

	test("the root fills the cell it was given", () => {
		expect(classes(gridItemVariants().root())).toContain("flex-1");
	});

	test("the footer is pushed to the bottom", () => {
		expect(classes(gridItemVariants().footer())).toContain("mt-auto");
	});

	test("the group is a positioning context for its cells", () => {
		expect(classes(gridItemVariants().group())).toContain("relative");
	});

	test("disabled dims to the same 50% as Pressable", () => {
		expect(classes(gridItemVariants({ isDisabled: true }).root())).toContain("opacity-50");
		expect(gridItemVariants({ isDisabled: false }).root()).not.toContain("opacity-");
	});

	test("a caller's className merges last", () => {
		expect(gridItemVariants({ variant: "muted" }).root({ className: "bg-primary" })).toContain("bg-primary");
		expect(gridItemVariants({ variant: "muted" }).root({ className: "bg-primary" })).not.toContain("bg-muted");
	});
});

describe("resolveGridItemVariant / resolveGridItemSize", () => {
	test("own value, else group, else default", () => {
		expect(resolveGridItemVariant("muted", "outline")).toBe("muted");
		expect(resolveGridItemVariant(undefined, "outline")).toBe("outline");
		expect(resolveGridItemVariant(undefined, undefined)).toBe("default");
		expect(resolveGridItemSize("sm", "default")).toBe("sm");
		expect(resolveGridItemSize(undefined, "sm")).toBe("sm");
		expect(resolveGridItemSize(undefined, undefined)).toBe("default");
	});
});

describe("resolveGridItemRender", () => {
	test("a handler makes it pressable", () => {
		expect(resolveGridItemRender({ onPress: () => {} })).toBe("pressable");
		expect(resolveGridItemRender({ onLongPress: () => {} })).toBe("pressable");
	});

	test("no handler is static content", () => {
		expect(resolveGridItemRender({})).toBe("static");
	});
});

describe("joinGridItemLabel", () => {
	test("joins title, value and description in that order", () => {
		expect(joinGridItemLabel({ description: "of 100 GB", title: "Storage", value: "74 GB" })).toBe(
			"Storage, 74 GB, of 100 GB"
		);
	});

	test("skips the parts that are missing or blank", () => {
		expect(joinGridItemLabel({ title: "Wi-Fi", value: "  " })).toBe("Wi-Fi");
	});

	test("nothing collected, no label", () => {
		expect(joinGridItemLabel({})).toBeUndefined();
	});
});
