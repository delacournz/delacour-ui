import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COLLAPSIBLE_SPRING } from "../collapsible/collapsible.variants";
import { ICON_SIZES } from "../icon/icon.variants";
import { TEXT_SIZES } from "../text/text.variants";
import {
	isNodeSelected,
	resolveSelection,
	resolveTreeAccessibility,
	resolveTreeAccessibilityAction,
	resolveTreeDisabled,
	resolveTreeForeground,
	resolveTreeIndent,
	resolveTreeIndicatorForeground,
	resolveTreeIndicatorHitSlop,
	resolveTreeIndicatorRotation,
	resolveTreeLineOffset,
	resolveTreeRowPress,
	TREE_DEFAULT_INDENT,
	TREE_DEFAULT_SIZE,
	TREE_GLYPH_STEP,
	TREE_INDICATOR_ROTATION,
	TREE_INDICATOR_WIDTH,
	TREE_LABEL_TEXT_SIZE,
	TREE_MIN_TOUCH,
	TREE_ROW_HEIGHT,
	TREE_ROW_INSET,
	TREE_SELECTION_MODES,
	TREE_SIZES,
	TREE_SPRING,
	type TreeSelectionState,
	toggleExpanded,
	treeVariants,
} from "./tree.variants";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** Tailwind's own spacing scale, in points. `w-6` is twenty-four. */
const SPACING_STEP_PX = 4;

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The step a `prefix-N` class sets — `min-h-11` with `min-h` yields 11. */
function step(value: string, prefix: string): number {
	const found = value.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`))?.[1];
	if (found === undefined) throw new Error(`no ${prefix}-* in "${value}"`);
	return Number(found);
}

const NONE: TreeSelectionState = { mode: "none" };

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(TREE_SIZES).toEqual(["sm", "md"]);
		expect(TREE_SELECTION_MODES).toEqual(["none", "single", "multiple"]);
		expect(TREE_DEFAULT_SIZE).toBe("md");
		expect(TREE_DEFAULT_INDENT).toBe(16);
	});

	test("the named default matches tv's defaultVariants", () => {
		const fromDefaults = treeVariants();
		const named = treeVariants({ size: TREE_DEFAULT_SIZE });
		for (const slot of ["root", "trigger", "press", "indicator", "label", "glyph"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});

	test("the spring is Collapsible's, restated rather than imported", () => {
		expect(TREE_SPRING).toEqual(COLLAPSIBLE_SPRING);
	});

	test("the indicator turns a quarter, from pointing at the label to pointing down", () => {
		expect(TREE_INDICATOR_ROTATION).toEqual({ collapsed: 0, expanded: 90 });
	});

	test("every size names a Text step and an icon step that exist", () => {
		for (const size of TREE_SIZES) {
			expect(TEXT_SIZES).toContain(TREE_LABEL_TEXT_SIZE[size]);
			expect(ICON_SIZES).toContain(TREE_GLYPH_STEP[size]);
		}
	});
});

describe("geometry the slots write out", () => {
	test("a row's height is the number the hit slop is computed from", () => {
		for (const size of TREE_SIZES) {
			expect(step(cls(treeVariants({ size }).trigger()), "min-h") * SPACING_STEP_PX).toBe(TREE_ROW_HEIGHT[size]);
		}
		expect(TREE_ROW_HEIGHT).toEqual({ sm: 36, md: 44 });
	});

	test("the indicator's column is the width the guide line centres under", () => {
		for (const size of TREE_SIZES) {
			expect(step(cls(treeVariants({ size }).indicator()), "w") * SPACING_STEP_PX).toBe(TREE_INDICATOR_WIDTH[size]);
		}
	});

	test("the row's end padding is the inset its start is computed from", () => {
		expect(step(cls(treeVariants().trigger()), "pe") * SPACING_STEP_PX).toBe(TREE_ROW_INSET);
	});

	test("the glyph slot writes out the icon step it names", () => {
		for (const size of TREE_SIZES) {
			expect(cls(treeVariants({ size }).glyph())).toContain(`size-icon-${TREE_GLYPH_STEP[size]}`);
		}
	});

	test("the guide line is a hairline and draws no text", () => {
		const line = cls(treeVariants().line());
		expect(line).toMatch(/\bw-px\b/);
		expect(line).toMatch(/\bbg-border\b/);
		expect(line).toMatch(/\babsolute\b/);
	});

	test("no slot uses a left or right utility — start and end only", () => {
		for (const size of TREE_SIZES) {
			for (const isSelected of [false, true]) {
				const slots = treeVariants({ size, isSelected });
				for (const slot of Object.values(slots)) {
					expect(cls(slot())).not.toMatch(/(^|\s)(pl|pr|ml|mr|left|right|border-l|border-r)-/);
				}
			}
		}
	});
});

describe("colour", () => {
	test("a selected row is filled with accent and its label carries accent-foreground", () => {
		const slots = treeVariants({ isSelected: true });
		expect(cls(slots.trigger())).toMatch(/\bbg-accent\b/);
		expect(cls(slots.label())).toMatch(/\btext-accent-foreground\b/);
		expect(cls(treeVariants({ isSelected: false }).trigger())).not.toMatch(/\bbg-accent\b/);
	});

	test("the label's colour class is the token a composed icon is handed", () => {
		for (const isSelected of [false, true]) {
			const token = resolveTreeForeground({ isSelected });
			expect(cls(treeVariants({ isSelected }).label())).toMatch(new RegExp(`(^|\\s)text-${token}(\\s|$)`));
		}
	});

	test("the indicator is quieter than the label until the row is selected", () => {
		const indicator: string = resolveTreeIndicatorForeground({ isSelected: false });
		const selectedIndicator: string = resolveTreeIndicatorForeground({ isSelected: true });
		expect(indicator).not.toBe(resolveTreeForeground({ isSelected: false }));
		expect(selectedIndicator).toBe(resolveTreeForeground({ isSelected: true }));
	});

	test("every token handed to a glyph is one theme.css declares", () => {
		for (const isSelected of [false, true]) {
			expect(THEME_CSS).toContain(`--${resolveTreeForeground({ isSelected })}:`);
			expect(THEME_CSS).toContain(`--${resolveTreeIndicatorForeground({ isSelected })}:`);
		}
	});

	test("disabled fades the row's content, never the pressable", () => {
		const slots = treeVariants({ isDisabled: true });
		expect(cls(slots.trigger())).toMatch(/\bopacity-50\b/);
		expect(cls(slots.press())).not.toMatch(/\bopacity-/);
		expect(cls(treeVariants({ isDisabled: false }).trigger())).not.toMatch(/\bopacity-/);
	});
});

describe("toggleExpanded", () => {
	test.each([
		{ expanded: [], value: "a", next: ["a"] },
		{ expanded: ["a"], value: "a", next: [] },
		{ expanded: ["a", "b"], value: "b", next: ["a"] },
		{ expanded: ["a"], value: "b", next: ["a", "b"] },
	])("$expanded toggling $value → $next", ({ expanded, value, next }) => {
		expect(toggleExpanded(expanded, value)).toEqual([...next]);
	});

	test("returns a new array and leaves the input alone", () => {
		const expanded = Object.freeze(["a"]);
		const next = toggleExpanded(expanded, "b");
		expect(next).not.toBe(expanded);
		expect(expanded).toEqual(["a"]);
	});
});

describe("resolveSelection", () => {
	test("none never changes", () => {
		expect(resolveSelection(NONE, "a")).toEqual(NONE);
	});

	test.each([
		{ value: null, pressed: "a", next: "a" },
		{ value: "a", pressed: "b", next: "b" },
		{ value: "a", pressed: "a", next: "a" },
	])("single: $value pressing $pressed → $next — a re-press keeps it", ({ value, pressed, next }) => {
		expect(resolveSelection({ mode: "single", value }, pressed)).toEqual({ mode: "single", value: next });
	});

	test.each([
		{ value: [], pressed: "a", next: ["a"] },
		{ value: ["a"], pressed: "b", next: ["a", "b"] },
		{ value: ["a", "b"], pressed: "a", next: ["b"] },
	])("multiple: $value pressing $pressed → $next", ({ value, pressed, next }) => {
		expect(resolveSelection({ mode: "multiple", value }, pressed)).toEqual({ mode: "multiple", value: next });
	});
});

describe("isNodeSelected", () => {
	test.each([
		{ selection: NONE, value: "a", selected: false },
		{ selection: { mode: "single", value: null }, value: "a", selected: false },
		{ selection: { mode: "single", value: "a" }, value: "a", selected: true },
		{ selection: { mode: "single", value: "a" }, value: "b", selected: false },
		{ selection: { mode: "multiple", value: [] }, value: "a", selected: false },
		{ selection: { mode: "multiple", value: ["a", "b"] }, value: "b", selected: true },
	] satisfies { selection: TreeSelectionState; value: string; selected: boolean }[])(
		"$selection.mode $selection.value has $value → $selected",
		({ selection, value, selected }) => {
			expect(isNodeSelected(selection, value)).toBe(selected);
		}
	);
});

describe("resolveTreeRowPress", () => {
	test.each([
		{ isBranch: false, expandOnPress: true, selectionMode: "none", toggle: false, select: false },
		{ isBranch: false, expandOnPress: true, selectionMode: "single", toggle: false, select: true },
		{ isBranch: false, expandOnPress: false, selectionMode: "multiple", toggle: false, select: true },
		{ isBranch: true, expandOnPress: true, selectionMode: "none", toggle: true, select: false },
		{ isBranch: true, expandOnPress: true, selectionMode: "single", toggle: true, select: true },
		{ isBranch: true, expandOnPress: false, selectionMode: "single", toggle: false, select: true },
		{ isBranch: true, expandOnPress: false, selectionMode: "multiple", toggle: false, select: true },
		{ isBranch: true, expandOnPress: false, selectionMode: "none", toggle: false, select: false },
	] as const)(
		"branch $isBranch, expandOnPress $expandOnPress, $selectionMode → toggle $toggle, select $select",
		({ isBranch, expandOnPress, selectionMode, toggle, select }) => {
			expect(resolveTreeRowPress({ isBranch, expandOnPress, selectionMode })).toEqual({ toggle, select });
		}
	);
});

describe("resolveTreeIndent", () => {
	test.each([
		{ level: 0, indent: 16, points: 0 },
		{ level: 1, indent: 16, points: 0 },
		{ level: 2, indent: 16, points: 16 },
		{ level: 4, indent: 16, points: 48 },
		{ level: 3, indent: 24, points: 48 },
		{ level: 3, indent: -8, points: 0 },
	])("level $level at $indent → $points", ({ level, indent, points }) => {
		expect(resolveTreeIndent(level, indent)).toBe(points);
	});
});

describe("resolveTreeLineOffset", () => {
	test("the guide sits under the centre of its branch's indicator", () => {
		for (const size of TREE_SIZES) {
			for (const level of [1, 2, 3]) {
				const centre = TREE_ROW_INSET + resolveTreeIndent(level, 16) + TREE_INDICATOR_WIDTH[size] / 2;
				expect(resolveTreeLineOffset({ level, indent: 16, size })).toBe(centre - 0.5);
			}
		}
	});

	test("a deeper branch's guide moves in by exactly one indent", () => {
		const a = resolveTreeLineOffset({ level: 1, indent: 20, size: "md" });
		const b = resolveTreeLineOffset({ level: 2, indent: 20, size: "md" });
		expect(b - a).toBe(20);
	});
});

describe("resolveTreeIndicatorRotation", () => {
	test.each([
		{ isExpanded: false, isRTL: false, degrees: 0 },
		{ isExpanded: true, isRTL: false, degrees: 90 },
		{ isExpanded: false, isRTL: true, degrees: 0 },
		{ isExpanded: true, isRTL: true, degrees: -90 },
	])("expanded $isExpanded, RTL $isRTL → $degrees°", ({ isExpanded, isRTL, degrees }) => {
		expect(resolveTreeIndicatorRotation({ isExpanded, isRTL })).toBe(degrees);
	});
});

describe("resolveTreeIndicatorHitSlop", () => {
	test("pads the indicator's column out to the minimum touch target", () => {
		for (const size of TREE_SIZES) {
			const slop = resolveTreeIndicatorHitSlop(size);
			expect(TREE_INDICATOR_WIDTH[size] + slop.left + slop.right).toBe(TREE_MIN_TOUCH);
			expect(TREE_ROW_HEIGHT[size] + slop.top + slop.bottom).toBe(TREE_MIN_TOUCH);
		}
		expect(TREE_MIN_TOUCH).toBe(44);
	});

	test("never negative", () => {
		const slop = resolveTreeIndicatorHitSlop("md");
		for (const edge of Object.values(slop)) expect(edge).toBeGreaterThanOrEqual(0);
	});
});

describe("resolveTreeDisabled", () => {
	test.each([
		{ root: undefined, item: undefined, disabled: false },
		{ root: undefined, item: true, disabled: true },
		{ root: true, item: false, disabled: true },
		{ root: false, item: true, disabled: false },
	])("root $root, item $item → $disabled — the root wins", ({ root, item, disabled }) => {
		expect(resolveTreeDisabled(root, item)).toBe(disabled);
	});
});

describe("resolveTreeAccessibility", () => {
	const base = {
		isBranch: false,
		isExpanded: false,
		isSelected: false,
		selectionMode: "none",
		isDisabled: false,
		level: 1,
	} as const;

	test("every row is a button announcing its level", () => {
		const a11y = resolveTreeAccessibility({ ...base, level: 2 });
		expect(a11y.role).toBe("button");
		expect(a11y.value).toEqual({ text: "Level 2" });
	});

	test("a leaf announces neither expanded nor any action", () => {
		const a11y = resolveTreeAccessibility(base);
		expect("expanded" in a11y.state).toBe(false);
		expect(a11y.actions).toEqual([]);
	});

	test("a branch announces expanded and offers the action that applies", () => {
		const closed = resolveTreeAccessibility({ ...base, isBranch: true });
		expect(closed.state.expanded).toBe(false);
		expect(closed.actions.map((action) => action.name)).toEqual(["expand"]);

		const open = resolveTreeAccessibility({ ...base, isBranch: true, isExpanded: true });
		expect(open.state.expanded).toBe(true);
		expect(open.actions.map((action) => action.name)).toEqual(["collapse"]);
	});

	test("selected is announced only when the tree selects", () => {
		expect("selected" in resolveTreeAccessibility(base).state).toBe(false);
		expect(resolveTreeAccessibility({ ...base, selectionMode: "single", isSelected: true }).state.selected).toBe(true);
		expect(resolveTreeAccessibility({ ...base, selectionMode: "multiple" }).state.selected).toBe(false);
	});

	test("a disabled branch is announced disabled and offers no action", () => {
		const a11y = resolveTreeAccessibility({ ...base, isBranch: true, isDisabled: true });
		expect(a11y.state.disabled).toBe(true);
		expect(a11y.actions).toEqual([]);
	});

	test("every action has a spoken label", () => {
		for (const isExpanded of [false, true]) {
			for (const action of resolveTreeAccessibility({ ...base, isBranch: true, isExpanded }).actions) {
				expect(action.label.length).toBeGreaterThan(0);
			}
		}
	});
});

describe("resolveTreeAccessibilityAction", () => {
	test.each([
		{ action: "expand", isExpanded: false, toggle: true },
		{ action: "expand", isExpanded: true, toggle: false },
		{ action: "collapse", isExpanded: true, toggle: true },
		{ action: "collapse", isExpanded: false, toggle: false },
		{ action: "activate", isExpanded: false, toggle: false },
	])("$action while expanded $isExpanded → toggle $toggle", ({ action, isExpanded, toggle }) => {
		expect(resolveTreeAccessibilityAction(action, isExpanded)).toBe(toggle);
	});
});
