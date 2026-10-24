import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants } from "../input/input.variants";
import { listGroupVariants } from "../list-group/list-group.variants";
import type { SelectEntry, SelectOptionInput } from "./select.types";
import {
	buildSelectRows,
	filterGroups,
	formatSelectedCount,
	matchesQuery,
	normalizeOptions,
	normalizeSearchText,
	resolveSelectIconToken,
	resolveSelectListMinHeight,
	resolveSelectRowState,
	resolveSelectSheetMaxHeight,
	resolveSelectTriggerClass,
	resolveSelectTriggerText,
	SELECT_DEFAULT_MAX_LABELS,
	SELECT_SHEET_MAX_FRACTION,
	SELECT_SHEET_TOP_GAP,
	selectVariants,
	splitHighlight,
	toggleSelection,
	toSelectedValues,
} from "./select.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Type-scale utilities share the `text-` prefix with colours; these are sizes, not tokens. */
const TEXT_SIZE_PATTERN = /^(xs|sm|base|lg|xl|\d?xl|input-\w+|button-\w+)$/;

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token as string)) continue;
		if (utility === "text" && TEXT_SIZE_PATTERN.test(token as string)) continue;
		tokens.push(token as string);
	}
	return tokens;
}

/** The slots this component declares, pinned so a new one has to be listed before the sweeps can miss it. */
const SLOT_NAMES = [
	"trigger",
	"value",
	"placeholder",
	"chevron",
	"row",
	"rowIcon",
	"rowContent",
	"rowLabel",
	"rowDescription",
	"rowIndicator",
	"rowCheckbox",
	"groupHeading",
	"header",
	"empty",
	"sheetBody",
] as const;

/** Every slot's class string at every cell of every axis, for the sweeps below. */
function everySlotClass(): string[] {
	const out: string[] = [];
	for (const variant of INPUT_VARIANTS) {
		for (const size of INPUT_SIZES) {
			for (const isSelected of [false, true]) {
				for (const isDisabled of [false, true]) {
					for (const isInvalid of [false, true]) {
						for (const isFocused of [false, true]) {
							const slots = selectVariants({ isDisabled, isFocused, isInvalid, isSelected, size, variant });
							for (const name of SLOT_NAMES) out.push(slots[name]() ?? "");
						}
					}
				}
			}
		}
	}
	return out;
}

const FRUIT: SelectOptionInput[] = [
	{ label: "Apple", value: "apple" },
	{ label: "Banana", value: "banana" },
	{ label: "Cherry", value: "cherry", isDisabled: true },
];

const COUNTRIES: SelectOptionInput[] = [
	{
		label: "Oceania",
		options: [
			{ label: "New Zealand", value: "nz" },
			{ label: "Australia", value: "au", description: "Includes territories" },
		],
	},
	{
		label: "Europe",
		options: [
			{ label: "France", value: "fr" },
			{ label: "Österreich", value: "at" },
		],
	},
];

describe("toSelectedValues", () => {
	test("reads an absent value as uncontrolled", () => {
		expect(toSelectedValues(undefined)).toBeUndefined();
	});

	test("reads a single null as nothing selected, and a string as one", () => {
		expect(toSelectedValues(null)).toEqual([]);
		expect(toSelectedValues("nz")).toEqual(["nz"]);
	});

	test("copies a multiple array rather than aliasing it", () => {
		const input = ["a", "b"] as const;
		const out = toSelectedValues(input);
		expect(out).toEqual(["a", "b"]);
		expect(out).not.toBe(input);
	});
});

describe("toggleSelection", () => {
	describe("single", () => {
		test("selects, replacing what was there", () => {
			expect(toggleSelection(["a"], "b", { mode: "single" })).toEqual({ change: "selected", selected: ["b"] });
			expect(toggleSelection([], "a", { mode: "single" })).toEqual({ change: "selected", selected: ["a"] });
		});

		test("keeps the choice on a second press", () => {
			expect(toggleSelection(["a"], "a", { mode: "single" })).toEqual({ change: "unchanged", selected: ["a"] });
		});

		test("clears on a second press when clearable", () => {
			expect(toggleSelection(["a"], "a", { isClearable: true, mode: "single" })).toEqual({
				change: "deselected",
				selected: [],
			});
		});
	});

	describe("multiple", () => {
		test("adds at the end, preserving insertion order", () => {
			expect(toggleSelection(["c", "a"], "b", { mode: "multiple" })).toEqual({
				change: "selected",
				selected: ["c", "a", "b"],
			});
		});

		test("removes one already chosen", () => {
			expect(toggleSelection(["c", "a", "b"], "a", { mode: "multiple" })).toEqual({
				change: "deselected",
				selected: ["c", "b"],
			});
		});

		test("refuses an add at the limit, and says so", () => {
			expect(toggleSelection(["a", "b"], "c", { max: 2, mode: "multiple" })).toEqual({
				change: "blocked",
				selected: ["a", "b"],
			});
		});

		test("still removes at the limit", () => {
			expect(toggleSelection(["a", "b"], "a", { max: 2, mode: "multiple" })).toEqual({
				change: "deselected",
				selected: ["b"],
			});
		});

		test("reports the add that reaches the limit", () => {
			expect(toggleSelection(["a"], "b", { max: 2, mode: "multiple" })).toEqual({
				change: "limit-reached",
				selected: ["a", "b"],
			});
		});

		test("never duplicates, even from a list that already did", () => {
			const { selected } = toggleSelection(["a", "a"], "b", { mode: "multiple" });
			expect(selected).toEqual(["a", "b"]);
		});

		test("does not mutate its input", () => {
			const current = ["a"];
			toggleSelection(current, "b", { mode: "multiple" });
			expect(current).toEqual(["a"]);
		});
	});
});

describe("normalizeOptions", () => {
	test("keeps a flat list in order with no group label", () => {
		const entries = normalizeOptions(FRUIT);
		expect(entries.map((entry) => entry.option.value)).toEqual(["apple", "banana", "cherry"]);
		expect(entries.every((entry) => entry.groupLabel === undefined)).toBe(true);
	});

	test("flattens groups, tagging each option with its heading", () => {
		const entries = normalizeOptions(COUNTRIES);
		expect(entries.map((entry) => [entry.groupLabel, entry.option.value])).toEqual([
			["Oceania", "nz"],
			["Oceania", "au"],
			["Europe", "fr"],
			["Europe", "at"],
		]);
	});

	test("drops a duplicate value, keeping the first", () => {
		const entries = normalizeOptions([
			{ label: "First", value: "x" },
			{ label: "G", options: [{ label: "Second", value: "x" }] },
		]);
		expect(entries).toHaveLength(1);
		expect(entries[0]?.option.label).toBe("First");
	});

	test("drops an empty group entirely", () => {
		const entries = normalizeOptions([{ label: "Empty", options: [] }, ...FRUIT]);
		expect(entries.some((entry) => entry.groupLabel === "Empty")).toBe(false);
		expect(buildSelectRows(entries).some((row) => row.kind === "heading")).toBe(false);
	});
});

describe("buildSelectRows", () => {
	test("puts a heading before each group's first option", () => {
		const rows = buildSelectRows(normalizeOptions(COUNTRIES));
		expect(rows.map((row) => (row.kind === "heading" ? `# ${row.label}` : row.option.value))).toEqual([
			"# Oceania",
			"nz",
			"au",
			"# Europe",
			"fr",
			"at",
		]);
	});

	test("gives every row a unique key", () => {
		const rows = buildSelectRows(normalizeOptions([...COUNTRIES, { label: "Oceania", value: "oceania" }]));
		expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
	});

	test("emits no heading for ungrouped options", () => {
		expect(buildSelectRows(normalizeOptions(FRUIT)).every((row) => row.kind === "option")).toBe(true);
	});
});

describe("matchesQuery", () => {
	test("matches everything on an empty or blank query", () => {
		expect(matchesQuery("Apple", "")).toBe(true);
		expect(matchesQuery("Apple", "   ")).toBe(true);
	});

	test("is case-insensitive and trims", () => {
		expect(matchesQuery("New Zealand", "  zEAl ")).toBe(true);
	});

	test("ignores diacritics on either side", () => {
		expect(matchesQuery("Österreich", "oster")).toBe(true);
		expect(matchesQuery("Eclair", "éCl")).toBe(true);
	});

	test("rejects a miss", () => {
		expect(matchesQuery("Apple", "pear")).toBe(false);
	});

	test("normalizeSearchText folds case and marks", () => {
		expect(normalizeSearchText("  Crème Brûlée ")).toBe("creme brulee");
	});
});

describe("filterGroups", () => {
	const entries = normalizeOptions(COUNTRIES);

	test("returns every entry on an empty query", () => {
		expect(filterGroups(entries, "")).toEqual(entries);
	});

	test("removes a group with no match, heading and all", () => {
		const rows = buildSelectRows(filterGroups(entries, "fra"));
		expect(rows.map((row) => (row.kind === "heading" ? `# ${row.label}` : row.option.value))).toEqual([
			"# Europe",
			"fr",
		]);
	});

	test("keeps disabled options that match", () => {
		const fruit = normalizeOptions(FRUIT);
		expect(filterGroups(fruit, "cher").map((entry) => entry.option.value)).toEqual(["cherry"]);
	});
});

describe("resolveSelectTriggerText", () => {
	const entries = normalizeOptions(COUNTRIES);

	test("is undefined with nothing selected, so the placeholder shows", () => {
		expect(resolveSelectTriggerText({ entries, mode: "single", selected: [] })).toBeUndefined();
		expect(resolveSelectTriggerText({ entries, mode: "multiple", selected: [] })).toBeUndefined();
	});

	test("is the label in single mode", () => {
		expect(resolveSelectTriggerText({ entries, mode: "single", selected: ["au"] })).toBe("Australia");
	});

	test("joins up to the label limit in multiple mode", () => {
		expect(resolveSelectTriggerText({ entries, mode: "multiple", selected: ["nz"] })).toBe("New Zealand");
		expect(resolveSelectTriggerText({ entries, mode: "multiple", selected: ["nz", "fr"] })).toBe("New Zealand, France");
	});

	test("switches to a count past the limit", () => {
		expect(SELECT_DEFAULT_MAX_LABELS).toBe(2);
		expect(resolveSelectTriggerText({ entries, mode: "multiple", selected: ["nz", "fr", "au"] })).toBe("3 selected");
	});

	test("takes a custom limit and a custom count formatter", () => {
		expect(
			resolveSelectTriggerText({
				entries,
				formatSelectedCount: (count) => `${count} pays`,
				maxLabels: 1,
				mode: "multiple",
				selected: ["nz", "fr"],
			})
		).toBe("2 pays");
	});

	test("skips a value with no option", () => {
		expect(resolveSelectTriggerText({ entries, mode: "single", selected: ["zz"] })).toBeUndefined();
		expect(resolveSelectTriggerText({ entries, mode: "multiple", selected: ["zz", "fr"] })).toBe("France");
	});

	test("formatSelectedCount reads as a count", () => {
		expect(formatSelectedCount(4)).toBe("4 selected");
	});
});

describe("resolveSelectRowState", () => {
	const enabled: SelectEntry["option"] = { label: "A", value: "a" };
	const disabled: SelectEntry["option"] = { isDisabled: true, label: "B", value: "b" };

	test("is enabled by default", () => {
		expect(resolveSelectRowState({ isSelected: false, option: enabled, selectedCount: 0 })).toEqual({
			isDisabled: false,
		});
	});

	test("is disabled by its option", () => {
		expect(resolveSelectRowState({ isSelected: false, option: disabled, selectedCount: 0 })).toEqual({
			isDisabled: true,
			reason: "option",
		});
	});

	test("disables unselected rows once the limit is reached", () => {
		expect(resolveSelectRowState({ isSelected: false, maxSelected: 2, option: enabled, selectedCount: 2 })).toEqual({
			isDisabled: true,
			reason: "limit",
		});
	});

	test("never disables a selected row for the limit", () => {
		expect(resolveSelectRowState({ isSelected: true, maxSelected: 2, option: enabled, selectedCount: 2 })).toEqual({
			isDisabled: false,
		});
	});

	test("ignores the limit below it", () => {
		expect(resolveSelectRowState({ isSelected: false, maxSelected: 2, option: enabled, selectedCount: 1 })).toEqual({
			isDisabled: false,
		});
	});
});

describe("the trigger", () => {
	test("wears every chrome utility Input's box does, cell for cell", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				for (const isInvalid of [false, true]) {
					for (const isDisabled of [false, true]) {
						for (const isFocused of [false, true]) {
							const box = inputVariants({ isDisabled, isFocused, isInvalid, size, variant }).root().split(/\s+/);
							const trigger = new Set(
								resolveSelectTriggerClass({ isDisabled, isFocused, isInvalid, size, variant }).split(/\s+/)
							);
							const missing = box.filter((cls) => cls && !trigger.has(cls));
							expect({ isDisabled, isFocused, isInvalid, missing, size, variant }).toEqual({
								isDisabled,
								isFocused,
								isInvalid,
								missing: [],
								size,
								variant,
							});
						}
					}
				}
			}
		}
	});

	test("is a row, so the value and the chevron share it", () => {
		expect(resolveSelectTriggerClass({})).toContain("flex-row");
	});

	test("lets a caller's class win", () => {
		expect(resolveSelectTriggerClass({ className: "h-20" })).toContain("h-20");
		expect(resolveSelectTriggerClass({ className: "h-20" })).not.toContain("h-input-md");
	});

	test("holds no text utility, which would never reach the Text inside", () => {
		for (const size of INPUT_SIZES) {
			const classes = resolveSelectTriggerClass({ size }).split(/\s+/);
			expect(classes.filter((cls) => cls.startsWith("text-") || cls.startsWith("font-"))).toEqual([]);
		}
	});

	test("sizes the value and placeholder with the field's own type scale", () => {
		for (const size of INPUT_SIZES) {
			const slots = selectVariants({ size });
			expect(slots.value()).toContain(`text-input-${size}`);
			expect(slots.placeholder()).toContain(`text-input-${size}`);
			expect(slots.placeholder()).toContain("text-muted-foreground");
		}
	});

	test("sizes the chevron with Input's decorator icon", () => {
		for (const size of INPUT_SIZES) {
			expect(selectVariants({ size }).chevron()).toContain(inputVariants({ size }).decoratorIcon());
		}
	});

	test("turns the chevron destructive when invalid", () => {
		expect(resolveSelectIconToken(false)).toBe("muted-foreground");
		expect(resolveSelectIconToken(true)).toBe("destructive");
	});
});

describe("the rows", () => {
	test("hold no text utility on the row itself", () => {
		for (const size of INPUT_SIZES) {
			for (const isSelected of [false, true]) {
				const classes = selectVariants({ isSelected, size }).row().split(/\s+/);
				const textual = classes.filter((cls) => /^(text|font)-/.test(cls) && !cls.startsWith("text-left"));
				expect(textual).toEqual([]);
			}
		}
	});

	test("use a floor rather than a fixed height, so a description can wrap", () => {
		for (const size of INPUT_SIZES) {
			const row = selectVariants({ size }).row();
			expect(row).not.toMatch(/(^|\s)h-/);
			expect(row).toMatch(/(^|\s)min-h-/);
		}
	});

	test("sit level with a ListGroup row at the same size", () => {
		for (const size of INPUT_SIZES) {
			const floor = (cls: string) => cls.match(/\bmin-h-[\w-]+\b/)?.[0];
			expect(floor(selectVariants({ size }).row())).toBe(floor(listGroupVariants({ size }).item()));
		}
	});

	test("tint when selected and fade when disabled", () => {
		expect(selectVariants({ isSelected: true }).row()).toContain("bg-accent");
		expect(selectVariants({ isSelected: false }).row()).not.toContain("bg-accent");
		expect(selectVariants({ isDisabled: true }).row()).toContain("opacity-50");
	});

	test("draw the multiple-mode box with Checkbox's tokens", () => {
		expect(selectVariants({ isSelected: false }).rowCheckbox()).toContain("border-input");
		expect(selectVariants({ isSelected: false }).rowCheckbox()).toContain("bg-card");
		expect(selectVariants({ isSelected: true }).rowCheckbox()).toContain("bg-primary");
	});
});

describe("tokens", () => {
	test("the theme reader found both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});

	test("every colour any slot names exists in both themes", () => {
		const missing = new Set<string>();
		for (const cls of everySlotClass()) {
			for (const token of colorTokens(cls)) {
				if (!LIGHT.has(token) || !DARK.has(token)) missing.add(token);
			}
		}
		expect([...missing]).toEqual([]);
	});

	test("no slot uses a dark: prefix", () => {
		expect(everySlotClass().filter((cls) => cls.includes("dark:"))).toEqual([]);
	});
});

describe("splitHighlight", () => {
	test("is one plain segment with no ranges", () => {
		expect(splitHighlight("Apple", [])).toEqual([{ isHighlighted: false, text: "Apple" }]);
		expect(splitHighlight("Apple", undefined)).toEqual([{ isHighlighted: false, text: "Apple" }]);
	});

	test("cuts the label around each range, in order", () => {
		expect(
			splitHighlight("New Zealand", [
				{ end: 7, start: 4 },
				{ end: 3, start: 0 },
			])
		).toEqual([
			{ isHighlighted: true, text: "New" },
			{ isHighlighted: false, text: " " },
			{ isHighlighted: true, text: "Zea" },
			{ isHighlighted: false, text: "land" },
		]);
	});

	test("clamps ranges to the label and drops empty or overlapping ones", () => {
		expect(
			splitHighlight("Pear", [
				{ end: 2, start: 0 },
				{ end: 3, start: 1 },
				{ end: 99, start: 3 },
				{ end: 1, start: 1 },
			])
		).toEqual([
			{ isHighlighted: true, text: "Pe" },
			{ isHighlighted: false, text: "a" },
			{ isHighlighted: true, text: "r" },
		]);
	});
});

describe("resolveSelectSheetMaxHeight", () => {
	test("caps a long list at a fraction of the window, so the page stays visible above it", () => {
		expect(resolveSelectSheetMaxHeight({ topInset: 0, windowHeight: 800 })).toBe(800 * SELECT_SHEET_MAX_FRACTION);
	});

	test("never reaches under the status bar, keeping a gap below the top inset", () => {
		const windowHeight = 400;
		const topInset = 100;
		expect(resolveSelectSheetMaxHeight({ topInset, windowHeight })).toBe(
			windowHeight - topInset - SELECT_SHEET_TOP_GAP
		);
	});

	test("is a whole number of points", () => {
		expect(Number.isInteger(resolveSelectSheetMaxHeight({ topInset: 59, windowHeight: 874 }))).toBe(true);
	});

	test("never goes negative on a degenerate window", () => {
		expect(resolveSelectSheetMaxHeight({ topInset: 50, windowHeight: 20 })).toBe(0);
	});
});

describe("resolveSelectListMinHeight", () => {
	const maxHeight = resolveSelectSheetMaxHeight({ topInset: 62, windowHeight: 874 });

	test("holds a searchable list at the cap, so a filter that drops rows cannot shrink the sheet", () => {
		expect(resolveSelectListMinHeight({ isSearchable: true, maxHeight, snapPoints: undefined })).toBe(maxHeight);
	});

	test("leaves a list without search sized to its rows", () => {
		expect(resolveSelectListMinHeight({ isSearchable: false, maxHeight, snapPoints: undefined })).toBeUndefined();
	});

	test("steps aside for caller snap points, which replace dynamic sizing", () => {
		expect(resolveSelectListMinHeight({ isSearchable: true, maxHeight, snapPoints: ["50%"] })).toBeUndefined();
	});
});
