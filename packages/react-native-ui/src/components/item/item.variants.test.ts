import { describe, expect, test } from "bun:test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { LIST_GROUP_SIZES, listGroupVariants } from "../list-group/list-group.variants";
import {
	ITEM_MEDIA_VARIANTS,
	ITEM_ORIENTATIONS,
	ITEM_SIZES,
	ITEM_VARIANTS,
	itemVariants,
	resolveItemFeedback,
	resolveItemRender,
	resolveItemSize,
	resolveItemSurface,
} from "./item.variants";

/** Pulls the horizontal padding step out of a class string — `px-4` yields 4. */
function paddingStep(cls: string): string | undefined {
	return cls.match(/\bpx-(\d+(?:\.\d+)?)\b/)?.[1];
}

/** Position of a class string's `size-icon-*` token on the shared icon scale. */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("resolveItemSurface", () => {
	test("a standalone item keeps its own variant", () => {
		for (const variant of ITEM_VARIANTS) {
			expect(resolveItemSurface(variant, false)).toBe(variant);
		}
	});

	// The group owns the surface: a border or a fill on each row would draw a
	// card inside a card.
	test("an item inside a ListGroup is always grouped, whatever its variant", () => {
		for (const variant of ITEM_VARIANTS) {
			expect(resolveItemSurface(variant, true)).toBe("grouped");
		}
	});
});

describe("resolveItemSize", () => {
	test("an explicit size wins over the group's", () => {
		expect(resolveItemSize("lg", "sm")).toBe("lg");
	});

	test("inherits the enclosing group's size when unset", () => {
		for (const size of LIST_GROUP_SIZES) {
			expect(resolveItemSize(undefined, size)).toBe(size);
		}
	});

	test("falls back to md outside a group", () => {
		expect(resolveItemSize(undefined, undefined)).toBe("md");
	});
});

describe("resolveItemFeedback", () => {
	test("a caller's feedback always wins", () => {
		expect(resolveItemFeedback("none", true)).toBe("none");
		expect(resolveItemFeedback("scale-fade", false)).toBe("scale-fade");
	});

	// A full-bleed row that scales reads as the whole card flexing.
	test("fades inside a group and scales standalone", () => {
		expect(resolveItemFeedback(undefined, true)).toBe("fade");
		expect(resolveItemFeedback(undefined, false)).toBe("scale");
	});
});

describe("resolveItemRender", () => {
	const noop = () => {};

	test("is static without a press handler, disabled or not", () => {
		expect(resolveItemRender({ isDisabled: false })).toBe("static");
		expect(resolveItemRender({ isDisabled: true })).toBe("static");
	});

	test("is a pressable with an enabled handler", () => {
		expect(resolveItemRender({ isDisabled: false, onPress: noop })).toBe("pressable");
		expect(resolveItemRender({ isDisabled: false, onLongPress: noop })).toBe("pressable");
	});

	// A disabled Pressable's animated opacity beats `opacity-50`, so the row
	// would never dim.
	test("drops the pressable when disabled", () => {
		expect(resolveItemRender({ isDisabled: true, onPress: noop })).toBe("inert");
	});
});

describe("itemVariants root slot", () => {
	test("gives every surface a distinct class string", () => {
		const surfaces = [...ITEM_VARIANTS, "grouped"] as const;
		const seen = new Set(surfaces.map((surface) => itemVariants({ surface }).root()));
		expect(seen.size).toBe(surfaces.length);
	});

	test("maps each surface", () => {
		expect(itemVariants({ surface: "default" }).root()).toContain("bg-transparent");
		expect(itemVariants({ surface: "outline" }).root()).toContain("border-border");
		expect(itemVariants({ surface: "muted" }).root()).toContain("bg-muted");
	});

	test("a standalone surface is rounded; a grouped one is not", () => {
		for (const surface of ITEM_VARIANTS) {
			expect(itemVariants({ surface }).root()).toMatch(/\brounded-/);
		}
		expect(itemVariants({ surface: "grouped" }).root()).not.toMatch(/\brounded-/);
		expect(itemVariants({ surface: "grouped" }).root()).not.toContain("border-border");
	});

	// Without it a short row leaves the press feedback ending mid-card.
	test("a grouped row spans the group", () => {
		expect(itemVariants({ surface: "grouped" }).root()).toContain("w-full");
	});

	test("holds no text colour — a View cannot cascade one", () => {
		for (const surface of [...ITEM_VARIANTS, "grouped"] as const) {
			expect(itemVariants({ surface }).root()).not.toMatch(/\btext-/);
		}
	});

	test("orientation picks the main axis", () => {
		expect(itemVariants({ orientation: "horizontal" }).root()).toContain("flex-row");
		expect(itemVariants({ orientation: "vertical" }).root()).toContain("flex-col");
		expect(itemVariants({ orientation: "vertical" }).root()).not.toContain("flex-row");
	});

	test("disabled dims the row", () => {
		expect(itemVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(itemVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("selected lays the accent over every surface, the muted fill included", () => {
		for (const surface of [...ITEM_VARIANTS, "grouped"] as const) {
			const cls = itemVariants({ isSelected: true, surface }).root();
			expect(cls).toContain("bg-accent");
			expect(cls).not.toContain("bg-muted");
			expect(cls).not.toContain("bg-transparent");
		}
	});
});

describe("itemVariants sizes", () => {
	// This is what makes an Item drop into a ListGroup: the group insets its
	// dividers by its own row padding, so the item's padding has to match it.
	test("row padding matches ListGroup's divider inset at every size", () => {
		for (const size of ITEM_SIZES) {
			const itemPadding = paddingStep(itemVariants({ size }).root());
			const dividerInset = listGroupVariants({ size })
				.divider()
				.match(/\bmx-(\d+(?:\.\d+)?)\b/)?.[1];
			expect(itemPadding).toBeDefined();
			expect(itemPadding).toBe(dividerInset);
		}
	});

	test("row metrics match a ListGroup row at every size", () => {
		for (const size of ITEM_SIZES) {
			const item = itemVariants({ size }).root();
			for (const cls of listGroupVariants({ size }).item().split(" ")) {
				if (/^(min-h|gap|px|py)-/.test(cls)) expect(item).toContain(cls);
			}
		}
	});

	test("title and description step up with size", () => {
		expect(itemVariants({ size: "sm" }).title()).toContain("text-sm");
		expect(itemVariants({ size: "md" }).title()).toContain("text-base");
		expect(itemVariants({ size: "lg" }).title()).toContain("text-lg");
		expect(itemVariants({ size: "sm" }).description()).toContain("text-xs");
		expect(itemVariants({ size: "md" }).description()).toContain("text-sm");
		expect(itemVariants({ size: "lg" }).description()).toContain("text-base");
	});

	test("text carries its own colour tokens", () => {
		expect(itemVariants().title()).toContain("text-foreground");
		expect(itemVariants().description()).toContain("text-muted-foreground");
	});

	test("every media icon names an ascending step on the shared icon scale", () => {
		for (const mediaVariant of ITEM_MEDIA_VARIANTS) {
			if (mediaVariant === "image") continue;
			const steps = ITEM_SIZES.map((size) => iconStep(itemVariants({ mediaVariant, size }).mediaIcon()));
			for (const step of steps) expect(step).toBeGreaterThanOrEqual(0);
			expect([...steps].sort((a, b) => a - b)).toEqual(steps);
			expect(new Set(steps).size).toBe(steps.length);
		}
	});

	test("a bare media icon matches ListGroup's prefix icon", () => {
		for (const size of ITEM_SIZES) {
			expect(itemVariants({ mediaVariant: "default", size }).mediaIcon()).toBe(
				listGroupVariants({ size }).prefixIcon()
			);
		}
	});
});

describe("itemVariants media slot", () => {
	test("the icon tile has a fill and a corner", () => {
		const cls = itemVariants({ mediaVariant: "icon" }).media();
		expect(cls).toContain("bg-muted");
		expect(cls).toMatch(/\brounded-/);
	});

	test("an image clips its child to the corner", () => {
		expect(itemVariants({ mediaVariant: "image" }).media()).toContain("overflow-hidden");
	});

	test("the icon tile and image are fixed squares that grow with size", () => {
		for (const mediaVariant of ["icon", "image"] as const) {
			const edges = ITEM_SIZES.map((size) => {
				const edge = itemVariants({ mediaVariant, size })
					.media()
					.match(/\bsize-(\d+)\b/)?.[1];
				return Number(edge);
			});
			for (const edge of edges) expect(edge).toBeGreaterThan(0);
			expect([...edges].sort((a, b) => a - b)).toEqual(edges);
		}
	});

	test("a tile stays visible on the muted and the selected surface", () => {
		for (const mediaVariant of ["icon", "image"] as const) {
			for (const cls of [
				itemVariants({ mediaVariant, surface: "muted" }).media(),
				itemVariants({ isSelected: true, mediaVariant }).media(),
			]) {
				expect(cls).toContain("bg-background");
				expect(cls).not.toContain("bg-muted");
			}
		}
	});

	test("a bare media slot draws nothing of its own", () => {
		const cls = itemVariants({ mediaVariant: "default" }).media();
		expect(cls).not.toMatch(/\bbg-/);
		expect(cls).not.toMatch(/\bsize-\d/);
	});
});

describe("itemVariants orientation", () => {
	// A `flex-1` column in an auto-height parent collapses to nothing in Yoga.
	test("content only flexes along a row", () => {
		expect(itemVariants({ orientation: "horizontal" }).content()).toContain("flex-1");
		expect(itemVariants({ orientation: "vertical" }).content()).not.toContain("flex-1");
	});

	test("header and footer are full-width strips on both axes", () => {
		for (const orientation of ITEM_ORIENTATIONS) {
			expect(itemVariants({ orientation }).header()).toContain("w-full");
			expect(itemVariants({ orientation }).footer()).toContain("w-full");
		}
	});

	test("a group runs down by default and across when horizontal", () => {
		expect(itemVariants({ groupOrientation: "vertical" }).group()).toContain("flex-col");
		expect(itemVariants({ groupOrientation: "horizontal" }).group()).toContain("flex-row");
	});
});
