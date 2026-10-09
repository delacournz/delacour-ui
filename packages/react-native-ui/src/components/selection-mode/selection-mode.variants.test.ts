import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	resolveBarVisible,
	resolveGridItemWidth,
	resolveGroupLayout,
	resolveHeaderCount,
	resolveIndicatorShown,
	resolveIsAllSelected,
	resolveIsSameSelection,
	resolveItemAccessibility,
	resolveItemPress,
	resolveSelectAll,
	resolveToggle,
	SELECTION_BAR_PLACEMENTS,
	SELECTION_INDICATORS,
	SELECTION_MODE_ACTION_FOREGROUND_TOKEN,
	SELECTION_MODE_CHECK_TOKEN,
	SELECTION_MODE_INDICATOR_OFFSET,
	selectionModeVariants,
} from "./selection-mode.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

describe("resolveToggle", () => {
	test("adds an unpicked value at the end, keeping the order things were picked in", () => {
		expect(resolveToggle({ selected: ["b", "a"], value: "c" })).toEqual(["b", "a", "c"]);
	});

	test("removes a picked value", () => {
		expect(resolveToggle({ selected: ["b", "a", "c"], value: "a" })).toEqual(["b", "c"]);
	});

	test("a disabled value never moves", () => {
		expect(resolveToggle({ isDisabled: true, selected: ["a"], value: "b" })).toEqual(["a"]);
		expect(resolveToggle({ isDisabled: true, selected: ["a"], value: "a" })).toEqual(["a"]);
	});

	test("refuses to add past the cap, but still removes at it", () => {
		expect(resolveToggle({ max: 2, selected: ["a", "b"], value: "c" })).toEqual(["a", "b"]);
		expect(resolveToggle({ max: 2, selected: ["a", "b"], value: "a" })).toEqual(["b"]);
		expect(resolveToggle({ max: 2, selected: ["a"], value: "c" })).toEqual(["a", "c"]);
	});

	test("never mutates the list it was handed", () => {
		const selected = ["a"] as const;
		resolveToggle({ selected, value: "b" });
		expect(selected).toEqual(["a"]);
	});
});

describe("resolveSelectAll", () => {
	test("keeps existing picks first, then fills in list order", () => {
		expect(resolveSelectAll({ selected: ["c"], values: ["a", "b", "c", "d"] })).toEqual(["c", "a", "b", "d"]);
	});

	test("stops at the cap", () => {
		expect(resolveSelectAll({ max: 2, selected: [], values: ["a", "b", "c"] })).toEqual(["a", "b"]);
		expect(resolveSelectAll({ max: 2, selected: ["c"], values: ["a", "b", "c"] })).toEqual(["c", "a"]);
	});

	test("never drops a pick already past the cap", () => {
		expect(resolveSelectAll({ max: 1, selected: ["a", "b"], values: ["a", "b", "c"] })).toEqual(["a", "b"]);
	});

	test("with nothing to pick from, changes nothing", () => {
		expect(resolveSelectAll({ selected: ["a"], values: [] })).toEqual(["a"]);
	});
});

describe("resolveIsAllSelected", () => {
	test("true once every value is picked", () => {
		expect(resolveIsAllSelected({ selected: ["b", "a"], values: ["a", "b"] })).toBe(true);
		expect(resolveIsAllSelected({ selected: ["a"], values: ["a", "b"] })).toBe(false);
	});

	test("true at the cap when the cap is below the total", () => {
		expect(resolveIsAllSelected({ max: 2, selected: ["a", "c"], values: ["a", "b", "c"] })).toBe(true);
		expect(resolveIsAllSelected({ max: 2, selected: ["a"], values: ["a", "b", "c"] })).toBe(false);
	});

	test("a cap above the total changes nothing", () => {
		expect(resolveIsAllSelected({ max: 9, selected: ["a"], values: ["a", "b"] })).toBe(false);
		expect(resolveIsAllSelected({ max: 9, selected: ["a", "b"], values: ["a", "b"] })).toBe(true);
	});

	test("an empty list is never all selected", () => {
		expect(resolveIsAllSelected({ selected: [], values: [] })).toBe(false);
	});
});

describe("resolveIsSameSelection", () => {
	test("compares contents in order", () => {
		expect(resolveIsSameSelection(["a", "b"], ["a", "b"])).toBe(true);
		expect(resolveIsSameSelection(["a", "b"], ["b", "a"])).toBe(false);
		expect(resolveIsSameSelection(["a"], ["a", "b"])).toBe(false);
		expect(resolveIsSameSelection([], [])).toBe(true);
	});
});

describe("resolveItemPress", () => {
	test("inactive, a press is the row's own", () => {
		expect(resolveItemPress({ isActive: false, isDisabled: false })).toEqual({ kind: "press" });
	});

	test("active, a press toggles", () => {
		expect(resolveItemPress({ isActive: true, isDisabled: false })).toEqual({ kind: "toggle" });
	});

	test("a disabled item keeps its own press, even while active", () => {
		expect(resolveItemPress({ isActive: true, isDisabled: true })).toEqual({ kind: "press" });
		expect(resolveItemPress({ isActive: false, isDisabled: true })).toEqual({ kind: "press" });
	});

	test("a press with no handler to run is no press at all", () => {
		expect(resolveItemPress({ hasOnPress: false, isActive: false, isDisabled: false })).toEqual({ kind: "none" });
		expect(resolveItemPress({ hasOnPress: false, isActive: true, isDisabled: true })).toEqual({ kind: "none" });
		expect(resolveItemPress({ hasOnPress: false, isActive: true, isDisabled: false })).toEqual({ kind: "toggle" });
	});
});

describe("resolveHeaderCount", () => {
	test("n of m with a total, prefixed by the title", () => {
		expect(resolveHeaderCount({ count: 3, total: 10 })).toBe("3 of 10");
		expect(resolveHeaderCount({ count: 3, title: "Select", total: 10 })).toBe("Select · 3 of 10");
	});

	test("n selected without one", () => {
		expect(resolveHeaderCount({ count: 2 })).toBe("2 selected");
		expect(resolveHeaderCount({ count: 2, title: "Select" })).toBe("2 selected");
	});
});

describe("resolveGroupLayout", () => {
	test("stacks by default", () => {
		expect(resolveGroupLayout({})).toEqual({ kind: "stack" });
		expect(resolveGroupLayout({ columns: 1 })).toEqual({ kind: "stack" });
	});

	test("a grid at two or more columns, floored", () => {
		expect(resolveGroupLayout({ columns: 5 })).toEqual({ columns: 5, kind: "grid" });
		expect(resolveGroupLayout({ columns: 3.7 })).toEqual({ columns: 3, kind: "grid" });
	});

	test("horizontal wins over columns", () => {
		expect(resolveGroupLayout({ columns: 4, isHorizontal: true })).toEqual({ kind: "strip" });
	});
});

describe("resolveGridItemWidth", () => {
	test("splits the row less its gaps", () => {
		expect(resolveGridItemWidth({ columns: 4, containerWidth: 336, gap: 12 })).toBe(75);
	});

	test("zero before the row has been measured", () => {
		expect(resolveGridItemWidth({ columns: 4, containerWidth: 0, gap: 12 })).toBe(0);
	});
});

describe("resolveIndicatorShown", () => {
	test("shown only while active, unless always shown", () => {
		expect(resolveIndicatorShown({ indicator: "leading", isActive: false })).toBe(false);
		expect(resolveIndicatorShown({ indicator: "leading", isActive: true })).toBe(true);
		expect(resolveIndicatorShown({ indicator: "leading", isActive: false, isIndicatorAlwaysShown: true })).toBe(true);
	});

	test("none never draws", () => {
		expect(resolveIndicatorShown({ indicator: "none", isActive: true, isIndicatorAlwaysShown: true })).toBe(false);
	});
});

describe("resolveBarVisible", () => {
	test("hidden while nothing is picked, unless asked otherwise", () => {
		expect(resolveBarVisible({ count: 0, isActive: true })).toBe(false);
		expect(resolveBarVisible({ count: 0, isActive: true, isShownWhenEmpty: true })).toBe(true);
		expect(resolveBarVisible({ count: 1, isActive: true })).toBe(true);
	});

	test("never shown outside the mode", () => {
		expect(resolveBarVisible({ count: 2, isActive: false, isShownWhenEmpty: true })).toBe(false);
	});
});

describe("resolveItemAccessibility", () => {
	test("a checkbox while active", () => {
		expect(resolveItemAccessibility({ isActive: true, isDisabled: false, isSelected: true })).toEqual({
			accessibilityHint: "Double-tap to select",
			accessibilityRole: "checkbox",
			accessibilityState: { checked: true, disabled: false },
			kind: "checkbox",
		});
	});

	test("inactive, offers the long press as an action", () => {
		expect(resolveItemAccessibility({ isActive: false, isDisabled: false, isSelected: false })).toEqual({
			accessibilityActions: [{ label: "Start selecting", name: "longpress" }],
			kind: "inherit",
		});
	});

	test("an inactive disabled item offers nothing it cannot do", () => {
		expect(resolveItemAccessibility({ isActive: false, isDisabled: true, isSelected: false })).toEqual({
			accessibilityActions: [],
			kind: "inherit",
		});
	});
});

describe("selectionModeVariants", () => {
	test("the indicator is round, and fills with the action colour when picked", () => {
		const off = selectionModeVariants({ isSelected: false }).indicator();
		const on = selectionModeVariants({ isSelected: true }).indicator();
		expect(off).toContain("rounded-full");
		expect(off).toContain("border-border");
		expect(on).toContain("bg-primary");
		expect(on).toContain("border-primary");
	});

	test("a picked leading row takes a faint fill; ring and none do not", () => {
		expect(selectionModeVariants({ indicator: "leading", isSelected: true }).item()).toContain("bg-primary/5");
		expect(selectionModeVariants({ indicator: "leading", isSelected: false }).item()).not.toContain("bg-primary/5");
		expect(selectionModeVariants({ indicator: "ring", isSelected: true }).item()).not.toContain("bg-primary/5");
		expect(selectionModeVariants({ indicator: "none", isSelected: true }).item()).not.toContain("bg-primary/5");
	});

	test("only a leading row lays out in a row", () => {
		expect(selectionModeVariants({ indicator: "leading" }).item()).toContain("flex-row");
		expect(selectionModeVariants({ indicator: "ring" }).item()).not.toContain("flex-row");
	});

	test("the ring sits a gap outside the item", () => {
		const ring = selectionModeVariants({}).ring();
		expect(ring).toContain("-inset-1");
		expect(ring).toContain("border-2");
		expect(ring).toContain("border-primary");
	});

	test("edge spans the width on the page; floating is an inset card", () => {
		const edge = selectionModeVariants({ placement: "edge" }).bar();
		const floating = selectionModeVariants({ placement: "floating" }).bar();
		expect(edge).toContain("bg-background");
		expect(edge).toContain("border-t");
		expect(floating).toContain("mx-4");
		expect(floating).toContain("rounded-2xl");
		expect(floating).toContain("bg-elevated");
		expect(floating).not.toContain("border-t");
	});

	test("a destructive action's label reads in the destructive colour", () => {
		expect(selectionModeVariants({ isDestructive: true }).actionLabel()).toContain("text-destructive");
		expect(selectionModeVariants({ isDestructive: false }).actionLabel()).toContain("text-foreground");
	});

	test("text colour sits on the label, never on the action", () => {
		expect(selectionModeVariants({ isDestructive: true }).action()).not.toMatch(/\btext-(destructive|foreground)\b/);
	});

	test("the leading offset is the indicator plus its gap", () => {
		expect(SELECTION_MODE_INDICATOR_OFFSET).toBe(34);
	});

	test("every axis value resolves", () => {
		for (const indicator of SELECTION_INDICATORS) {
			for (const placement of SELECTION_BAR_PLACEMENTS) {
				expect(() => selectionModeVariants({ indicator, placement }).root()).not.toThrow();
			}
		}
	});
});

describe("tokens", () => {
	test("the action label and its icon read the same token", () => {
		expect(selectionModeVariants({ isDestructive: true }).actionLabel()).toContain(
			`text-${SELECTION_MODE_ACTION_FOREGROUND_TOKEN.destructive}`
		);
		expect(selectionModeVariants({ isDestructive: false }).actionLabel()).toContain(
			`text-${SELECTION_MODE_ACTION_FOREGROUND_TOKEN.default}`
		);
	});

	test("names only tokens both themes declare", () => {
		for (const token of [...Object.values(SELECTION_MODE_ACTION_FOREGROUND_TOKEN), SELECTION_MODE_CHECK_TOKEN]) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
		for (const token of ["primary", "border", "elevated", "background", "destructive"]) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});
