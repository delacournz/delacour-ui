import { describe, expect, test } from "bun:test";
import {
	resolveGroupProps,
	resolveOptionHitSlop,
	THEME_SELECTOR_SIZES,
	THEME_SELECTOR_VARIANTS,
	themeSelectorVariants,
} from "./theme-selector.variants";

const RAW_PALETTE = /\b(?:bg|text|border|ring)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|blue|green)-\d+)\b/;

function classesOf(variant: (typeof THEME_SELECTOR_VARIANTS)[number], size: (typeof THEME_SELECTOR_SIZES)[number]) {
	const slots = themeSelectorVariants({ size, variant });
	return { icon: slots.icon(), option: slots.option(), root: slots.root() };
}

describe("themeSelectorVariants", () => {
	test("every variant and size emits root and option classes", () => {
		for (const variant of THEME_SELECTOR_VARIANTS) {
			for (const size of THEME_SELECTOR_SIZES) {
				const { root, option } = classesOf(variant, size);
				expect(root.length).toBeGreaterThan(0);
				expect(option.length).toBeGreaterThan(0);
			}
		}
	});

	test("a card stacks its glyph over its label; a segment does not", () => {
		for (const size of THEME_SELECTOR_SIZES) {
			expect(classesOf("cards", size).option).toContain("flex-col");
			expect(classesOf("segmented", size).option).not.toContain("flex-col");
		}
	});

	test("every option shares the row equally", () => {
		for (const variant of THEME_SELECTOR_VARIANTS) {
			for (const size of THEME_SELECTOR_SIZES) {
				expect(classesOf(variant, size).option).toContain("flex-1");
			}
		}
	});

	test("a card's glyph is larger than a segment's", () => {
		for (const size of THEME_SELECTOR_SIZES) {
			expect(classesOf("cards", size).icon).not.toBe(classesOf("segmented", size).icon);
		}
	});

	test("uses semantic tokens only: no raw palette, no dark: prefix", () => {
		for (const variant of THEME_SELECTOR_VARIANTS) {
			for (const size of THEME_SELECTOR_SIZES) {
				const all = Object.values(classesOf(variant, size)).join(" ");
				expect(all).not.toMatch(RAW_PALETTE);
				expect(all).not.toContain("dark:");
			}
		}
	});

	test("a caller's className is merged onto the root", () => {
		expect(themeSelectorVariants({}).root({ className: "mt-4" })).toContain("mt-4");
	});
});

describe("resolveGroupProps", () => {
	test("segmented joins into one run, cards stand apart", () => {
		expect(resolveGroupProps("segmented").layout).toBe("attached");
		expect(resolveGroupProps("cards").layout).toBe("detached");
	});

	test("is always one required choice", () => {
		for (const variant of THEME_SELECTOR_VARIANTS) {
			const props = resolveGroupProps(variant);
			expect(props.selectionMode).toBe("single");
			expect(props.selectionMode).not.toBe("multiple");
			expect(props.isSelectionRequired).toBe(true);
		}
	});
});

describe("resolveOptionHitSlop", () => {
	test("only the small step needs extra reach to make 44pt", () => {
		expect(resolveOptionHitSlop("sm")).toBeGreaterThan(0);
		expect(resolveOptionHitSlop("md")).toBeUndefined();
		expect(resolveOptionHitSlop("lg")).toBeUndefined();
	});
});
