import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { CHIP_SIZES } from "../chip/chip.variants";
import { INPUT_SIZES, INPUT_VARIANTS } from "../input/input.variants";
import {
	resolveSearchBarCancelVisibility,
	resolveSearchBarClearVisibility,
	resolveSearchBarCorner,
	resolveSearchBarSuffix,
	resolveTokenBackspace,
	SEARCH_BAR_CANCEL_BUTTON_SIZE,
	SEARCH_BAR_CANCEL_MODES,
	SEARCH_BAR_SHAPES,
	SEARCH_BAR_SIZES,
	SEARCH_BAR_TOKEN_CHIP_SIZE,
	SEARCH_BAR_VARIANTS,
	searchBarVariants,
} from "./search-bar.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Every slot's class string, for every cell of the matrix. */
function everySlotClass(): string[] {
	const out: string[] = [];
	for (const shape of SEARCH_BAR_SHAPES) {
		const slots = searchBarVariants({ shape });
		out.push(slots.root(), slots.field(), slots.tokens(), slots.tokensContent(), slots.cancel(), slots.clear());
	}
	return out;
}

describe("axes", () => {
	test("size and variant are Input's own tuples, not copies", () => {
		expect(SEARCH_BAR_SIZES).toBe(INPUT_SIZES);
		expect(SEARCH_BAR_VARIANTS).toBe(INPUT_VARIANTS);
	});

	test("three cancel modes and two shapes", () => {
		expect([...SEARCH_BAR_CANCEL_MODES]).toEqual(["never", "focus", "always"]);
		expect([...SEARCH_BAR_SHAPES]).toEqual(["pill", "rounded"]);
	});

	test("every size maps to a chip size and a cancel button size", () => {
		for (const size of SEARCH_BAR_SIZES) {
			expect(CHIP_SIZES).toContain(SEARCH_BAR_TOKEN_CHIP_SIZE[size]);
			expect(["sm", "md", "lg"]).toContain(SEARCH_BAR_CANCEL_BUTTON_SIZE[size]);
		}
	});

	test("a token chip never steps up past the field", () => {
		const order = ["sm", "md", "lg"] as const;
		for (const size of SEARCH_BAR_SIZES) {
			expect(order.indexOf(SEARCH_BAR_TOKEN_CHIP_SIZE[size])).toBeLessThanOrEqual(order.indexOf(size));
		}
	});
});

describe("resolveSearchBarCorner", () => {
	test("pill rounds the box fully", () => {
		expect(resolveSearchBarCorner("pill")).toBe("rounded-full");
	});

	test("rounded leaves Input's own corner alone", () => {
		expect(resolveSearchBarCorner("rounded")).toBe("");
	});

	test("the field slot carries the corner and nothing else of the box", () => {
		expect(searchBarVariants({ shape: "pill" }).field()).toContain("rounded-full");
		expect(searchBarVariants({ shape: "rounded" }).field()).not.toContain("rounded");
	});
});

describe("slot hygiene", () => {
	test("the field slot draws no chrome of its own — Input owns the box", () => {
		for (const shape of SEARCH_BAR_SHAPES) {
			const cls = searchBarVariants({ shape }).field();
			expect(cls).not.toMatch(/\bborder\b|\bborder-/);
			expect(cls).not.toMatch(/\bbg-/);
			expect(cls).not.toMatch(/\bh-/);
			expect(cls).not.toMatch(/\bpx-|\bpy-|\bp-/);
		}
	});

	test("the root carries no text colour — a View does not cascade it", () => {
		for (const shape of SEARCH_BAR_SHAPES) {
			expect(searchBarVariants({ shape }).root()).not.toMatch(/\btext-/);
		}
	});

	test("the token row is capped to a share of the width", () => {
		expect(searchBarVariants().tokens()).toContain("max-w-[60%]");
	});

	test("no dark: prefix anywhere", () => {
		for (const cls of everySlotClass()) {
			expect(cls).not.toContain("dark:");
		}
	});

	test("every colour token named exists in both themes", () => {
		const tokens = everySlotClass()
			.flatMap((cls) => cls.split(/\s+/))
			.map((utility) => utility.match(/^(?:bg|text|border)-([a-z-]+)$/)?.[1])
			.filter((name): name is string => name !== undefined && !/^(input|button)-|^(xs|sm|base|lg|xl)$/.test(name));
		for (const token of tokens) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("resolveSearchBarSuffix", () => {
	const base = { isDisabled: false, isLoading: false, isReadOnly: false, value: "" };

	test("nothing while empty", () => {
		expect(resolveSearchBarSuffix(base)).toBe("none");
	});

	test("clear once there is text", () => {
		expect(resolveSearchBarSuffix({ ...base, value: "a" })).toBe("clear");
	});

	test("a spinner replaces clear while loading, empty or not", () => {
		expect(resolveSearchBarSuffix({ ...base, isLoading: true, value: "a" })).toBe("spinner");
		expect(resolveSearchBarSuffix({ ...base, isLoading: true })).toBe("spinner");
	});

	test("disabled or read-only never offers clear", () => {
		expect(resolveSearchBarSuffix({ ...base, isDisabled: true, value: "a" })).toBe("none");
		expect(resolveSearchBarSuffix({ ...base, isReadOnly: true, value: "a" })).toBe("none");
	});
});

describe("resolveSearchBarClearVisibility", () => {
	const base = { isDisabled: false, isLoading: false, isReadOnly: false, value: "" };

	test("true only when there is text and nothing blocks it", () => {
		expect(resolveSearchBarClearVisibility({ ...base, value: "x" })).toBe(true);
		expect(resolveSearchBarClearVisibility(base)).toBe(false);
		expect(resolveSearchBarClearVisibility({ ...base, isLoading: true, value: "x" })).toBe(false);
		expect(resolveSearchBarClearVisibility({ ...base, isDisabled: true, value: "x" })).toBe(false);
		expect(resolveSearchBarClearVisibility({ ...base, isReadOnly: true, value: "x" })).toBe(false);
	});
});

describe("resolveSearchBarCancelVisibility", () => {
	const states = [
		{ hasValue: false, isFocused: false },
		{ hasValue: true, isFocused: false },
		{ hasValue: false, isFocused: true },
		{ hasValue: true, isFocused: true },
	];

	test("never is never shown", () => {
		for (const state of states) {
			expect(resolveSearchBarCancelVisibility("never", state)).toBe(false);
		}
	});

	test("always is always shown", () => {
		for (const state of states) {
			expect(resolveSearchBarCancelVisibility("always", state)).toBe(true);
		}
	});

	test("focus follows focus alone", () => {
		for (const state of states) {
			expect(resolveSearchBarCancelVisibility("focus", state)).toBe(state.isFocused);
		}
	});

	test("a disabled bar offers no cancel in any mode", () => {
		for (const mode of SEARCH_BAR_CANCEL_MODES) {
			expect(resolveSearchBarCancelVisibility(mode, { hasValue: true, isDisabled: true, isFocused: true })).toBe(false);
		}
	});
});

describe("resolveTokenBackspace", () => {
	const tokens = [
		{ id: "a", label: "A" },
		{ id: "b", label: "B" },
	];

	test("empty text with tokens removes the last token", () => {
		expect(resolveTokenBackspace("", tokens)).toEqual({ kind: "remove", token: { id: "b", label: "B" } });
	});

	test("text still in the field is deleted first", () => {
		expect(resolveTokenBackspace("x", tokens)).toEqual({ kind: "none" });
	});

	test("no tokens, nothing to remove", () => {
		expect(resolveTokenBackspace("", [])).toEqual({ kind: "none" });
		expect(resolveTokenBackspace("", undefined)).toEqual({ kind: "none" });
	});
});
