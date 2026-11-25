import { describe, expect, test } from "bun:test";
import { declaredTokens, TOKENS_CSS } from "../../styles/theme-tokens.test";
import { bottomSheetVariants } from "../bottom-sheet/bottom-sheet.variants";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants, resolveInputGroupClass } from "../input/input.variants";
import {
	resolveSelectSheetMaxHeight,
	resolveSelectTriggerClass,
	SELECT_SHEET_TOP_GAP,
} from "../select/select.variants";
import {
	COMBOBOX_CLEAR_GAP,
	COMBOBOX_CLEAR_SIZE,
	COMBOBOX_DEFAULT_MAX_CHIPS,
	COMBOBOX_KEYBOARD_ESTIMATE_FRACTION,
	COMBOBOX_TRIGGER_HEIGHTS,
	comboboxTriggerHeightVariable,
	comboboxVariants,
	resolveComboboxChipColor,
	resolveComboboxChipSize,
	resolveComboboxClearHitSlop,
	resolveComboboxSheetHeight,
	resolveComboboxSheetMaxHeight,
	resolveComboboxTriggerActionOutcome,
	resolveComboboxTriggerActions,
	resolveComboboxTriggerClass,
	resolveComboboxTriggerHitSlop,
	resolveComboboxTriggerLabel,
	resolveComboboxTriggerText,
	resolveExpectedKeyboardHeight,
	resolveVisibleChips,
} from "./combobox.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);
const TEXT_SIZE_PATTERN = /^(xs|sm|base|lg|xl|\d?xl|input-\w+|button-\w+)$/;

function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token as string)) continue;
		if (utility === "text" && TEXT_SIZE_PATTERN.test(token as string)) continue;
		tokens.push(token as string);
	}
	return tokens;
}

const SLOT_NAMES = [
	"chips",
	"chipOverflow",
	"clear",
	"createRow",
	"createLabel",
	"header",
	"headerClose",
	"results",
	"empty",
	"sheetBody",
] as const;

function everySlotClass(): string[] {
	const out: string[] = [];
	for (const variant of INPUT_VARIANTS) {
		for (const size of INPUT_SIZES) {
			const slots = comboboxVariants({ size, variant });
			for (const name of SLOT_NAMES) out.push(slots[name]() ?? "");
		}
	}
	return out;
}

const BOOLS = [false, true] as const;

/** Every variant, size and state the trigger can be drawn in. */
function everyCell() {
	return INPUT_VARIANTS.flatMap((variant) =>
		INPUT_SIZES.flatMap((size) =>
			BOOLS.flatMap((isDisabled) =>
				BOOLS.flatMap((isFocused) => BOOLS.map((isInvalid) => ({ isDisabled, isFocused, isInvalid, size, variant })))
			)
		)
	);
}

describe("comboboxVariants header", () => {
	test("is opaque in the sheet's colour, so pinned it hides the rows scrolling under it", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				expect(comboboxVariants({ size, variant }).header().split(" ")).toContain("bg-popover");
			}
		}
	});

	test("carries the list's top padding, so it pins where it rests instead of riding up 8pt", () => {
		for (const size of INPUT_SIZES) {
			const slots = comboboxVariants({ size });
			expect(slots.header().split(" ")).toContain("pt-2");
			expect(bottomSheetVariants().scrollContent({ className: slots.sheetBody() }).split(" ")).toContain("pt-0");
		}
	});

	test("the close keeps its place when the header takes the list's top padding", () => {
		for (const size of INPUT_SIZES) {
			const close = bottomSheetVariants()
				.close({ className: comboboxVariants({ size }).headerClose() })
				.split(" ");
			expect(close).toContain("top-6");
			expect(close).not.toContain("top-4");
		}
	});
});

describe("resolveComboboxTriggerClass", () => {
	test("is Select's trigger exactly, at every cell, while it shows text", () => {
		for (const state of everyCell()) {
			expect(resolveComboboxTriggerClass({ ...state, hasChips: false })).toBe(resolveSelectTriggerClass(state));
		}
	});

	test("with chips, grows from the field's height as a floor, aligns to the first line, and keeps the rest of the box", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				for (const isInvalid of BOOLS) {
					const box = resolveInputGroupClass({ isInvalid, size, variant }).split(/\s+/);
					const trigger = new Set(
						resolveComboboxTriggerClass({ hasChips: true, isInvalid, size, variant }).split(/\s+/)
					);
					const missing = box.filter(
						(cls) => cls && cls !== `h-input-${size}` && cls !== "py-0" && cls !== "items-center" && !trigger.has(cls)
					);
					expect({ missing, size, variant }).toEqual({ missing: [], size, variant });
					expect(trigger.has(`min-h-input-${size}`)).toBe(true);
					expect(trigger.has(`h-input-${size}`)).toBe(false);
					expect(trigger.has("items-start")).toBe(true);
				}
			}
		}
	});

	test("with chips, is Input's multiline box, so it wraps the way a textarea grows", () => {
		const root = inputVariants({ isGrouped: true, isMultiline: true, size: "md" }).root();
		for (const cls of root.split(/\s+/)) {
			expect(resolveComboboxTriggerClass({ hasChips: true, size: "md" })).toContain(cls);
		}
	});

	test("a caller's class lands last", () => {
		expect(resolveComboboxTriggerClass({ className: "mt-4", hasChips: false })).toContain("mt-4");
		expect(resolveComboboxTriggerClass({ className: "mt-4", hasChips: true })).toContain("mt-4");
	});
});

describe("resolveComboboxChipSize", () => {
	test("sm at sm and md, md at lg", () => {
		expect(resolveComboboxChipSize("sm")).toBe("sm");
		expect(resolveComboboxChipSize("md")).toBe("sm");
		expect(resolveComboboxChipSize("lg")).toBe("md");
	});
});

describe("resolveComboboxChipColor", () => {
	test("destructive only while marked for removal", () => {
		expect(resolveComboboxChipColor(false)).toBe("default");
		expect(resolveComboboxChipColor(true)).toBe("destructive");
	});
});

describe("resolveVisibleChips", () => {
	test("shows them all at or under the cap", () => {
		expect(resolveVisibleChips({ count: 2, max: 3 })).toEqual({ overflow: 0, visible: 2 });
		expect(resolveVisibleChips({ count: 3, max: 3 })).toEqual({ overflow: 0, visible: 3 });
	});

	test("past the cap, shows one fewer and a +N that counts the rest", () => {
		expect(resolveVisibleChips({ count: 5, max: 3 })).toEqual({ overflow: 3, visible: 2 });
	});

	test("defaults the cap", () => {
		expect(resolveVisibleChips({ count: COMBOBOX_DEFAULT_MAX_CHIPS }).overflow).toBe(0);
		expect(resolveVisibleChips({ count: COMBOBOX_DEFAULT_MAX_CHIPS + 1 }).overflow).toBe(2);
	});

	test("a cap below one still shows the count", () => {
		expect(resolveVisibleChips({ count: 4, max: 0 })).toEqual({ overflow: 4, visible: 0 });
	});
});

describe("resolveComboboxTriggerText", () => {
	const apple = { label: "Apple", value: "apple" };
	const fig = { label: "Fig", value: "fig" };

	test("multiple takes a localised count formatter", () => {
		expect(
			resolveComboboxTriggerText({
				formatSelectedCount: (count) => `${count} gewählt`,
				mode: "multiple",
				selected: [apple, fig],
			})
		).toBe("2 gewählt");
	});

	test("nothing chosen is undefined, so the placeholder shows", () => {
		expect(resolveComboboxTriggerText({ mode: "single", selected: [] })).toBeUndefined();
		expect(resolveComboboxTriggerText({ mode: "multiple", selected: [] })).toBeUndefined();
	});

	test("single reads the label", () => {
		expect(resolveComboboxTriggerText({ mode: "single", selected: [apple] })).toBe("Apple");
	});

	test("multiple announces the count — the chips carry the labels", () => {
		expect(resolveComboboxTriggerText({ mode: "multiple", selected: [apple, fig] })).toBe("2 selected");
	});

	test("takes a formatter to localise the count", () => {
		expect(
			resolveComboboxTriggerText({ formatSelectedCount: (n) => `${n} choisis`, mode: "multiple", selected: [fig] })
		).toBe("1 choisis");
	});
});

describe("resolveComboboxSheetMaxHeight", () => {
	test("is Select's cap with no keyboard", () => {
		expect(resolveComboboxSheetMaxHeight({ keyboardHeight: 0, topInset: 62, windowHeight: 874 })).toBe(
			resolveSelectSheetMaxHeight({ topInset: 62, windowHeight: 874 })
		);
	});

	test("takes the keyboard out of the room below the top inset", () => {
		expect(resolveComboboxSheetMaxHeight({ keyboardHeight: 336, topInset: 62, windowHeight: 874 })).toBe(
			874 - 62 - SELECT_SHEET_TOP_GAP - 336
		);
	});

	test("never exceeds Select's cap, and never goes below zero", () => {
		expect(resolveComboboxSheetMaxHeight({ keyboardHeight: 1, topInset: 0, windowHeight: 874 })).toBe(
			resolveSelectSheetMaxHeight({ topInset: 0, windowHeight: 874 })
		);
		expect(resolveComboboxSheetMaxHeight({ keyboardHeight: 2000, topInset: 62, windowHeight: 874 })).toBe(0);
	});
});

describe("resolveExpectedKeyboardHeight", () => {
	test("a keyboard on its way wins", () => {
		expect(
			resolveExpectedKeyboardHeight({ expectsKeyboard: true, keyboardHeight: 300, lastKnown: 280, windowHeight: 874 })
		).toBe(300);
	});

	test("before it starts, the last one measured stands in for it", () => {
		expect(
			resolveExpectedKeyboardHeight({ expectsKeyboard: true, keyboardHeight: 0, lastKnown: 336, windowHeight: 874 })
		).toBe(336);
	});

	test("with none measured yet, a fraction of the window", () => {
		expect(
			resolveExpectedKeyboardHeight({ expectsKeyboard: true, keyboardHeight: 0, lastKnown: 0, windowHeight: 1000 })
		).toBe(Math.round(1000 * COMBOBOX_KEYBOARD_ESTIMATE_FRACTION));
	});

	test("nothing is expected when the field will not focus, or the sheet is shut", () => {
		expect(
			resolveExpectedKeyboardHeight({ expectsKeyboard: false, keyboardHeight: 0, lastKnown: 336, windowHeight: 874 })
		).toBe(0);
	});

	test("a keyboard that is up counts even when none was expected", () => {
		expect(
			resolveExpectedKeyboardHeight({ expectsKeyboard: false, keyboardHeight: 320, lastKnown: 0, windowHeight: 874 })
		).toBe(320);
	});
});

describe("resolveComboboxSheetHeight", () => {
	const room = { topInset: 62, windowHeight: 874 };

	test("is Select's cap for an empty screen — the keyboard covers the sheet's bottom rather than lifting it", () => {
		expect(resolveComboboxSheetHeight(room)).toBe(resolveSelectSheetMaxHeight(room));
	});

	test("is taller than the room above any keyboard, so a keyboard never moves it", () => {
		expect(resolveComboboxSheetHeight(room)).toBeGreaterThan(
			resolveComboboxSheetMaxHeight({ ...room, keyboardHeight: 336 })
		);
	});
});

describe("tokens", () => {
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

describe("resolveComboboxClearHitSlop", () => {
	test("the glyph and gap match the icon and row-gap tokens", () => {
		const icon = { sm: "sm", md: "md", lg: "lg" } as const;
		for (const size of INPUT_SIZES) {
			const px = TOKENS_CSS.match(new RegExp(`--spacing-icon-${icon[size]}:\\s*(\\d+)px`))?.[1];
			expect(Number(px)).toBe(COMBOBOX_CLEAR_SIZE[size]);
		}
		expect(COMBOBOX_CLEAR_GAP).toEqual({ lg: 10, md: 8, sm: 6 });
	});

	test("vertical reach is 44 at every size", () => {
		for (const size of INPUT_SIZES) {
			const slop = resolveComboboxClearHitSlop(size);
			expect(slop).toBeDefined();
			expect(COMBOBOX_CLEAR_SIZE[size] + 2 * (slop?.top ?? 0)).toBeGreaterThanOrEqual(44);
			expect(slop?.top).toBe(slop?.bottom);
		}
	});

	test("horizontal slop never leaves the gap beside the glyph", () => {
		for (const size of INPUT_SIZES) {
			const slop = resolveComboboxClearHitSlop(size);
			expect(slop?.left).toBeLessThanOrEqual(COMBOBOX_CLEAR_GAP[size]);
			expect(slop?.right).toBeLessThanOrEqual(COMBOBOX_CLEAR_GAP[size]);
		}
	});

	test("Material's 48 asks for more vertically, the same horizontally", () => {
		expect(resolveComboboxClearHitSlop("md", 48)?.top).toBe(15);
		expect(resolveComboboxClearHitSlop("md", 48)?.left).toBe(8);
	});

	test("a minimum the glyph already meets needs no slop", () => {
		expect(resolveComboboxClearHitSlop("md", 18)).toBeUndefined();
	});
});

describe("resolveComboboxTriggerActions", () => {
	const chips = [
		{ label: "Australia", value: "au" },
		{ label: "Fiji", value: "fj" },
	];
	const labels = { clear: "Clear", removeChip: (label: string) => `Remove ${label}` };

	test("offers clear and one remove per drawn chip, named by value", () => {
		expect(resolveComboboxTriggerActions({ canClear: true, chips, isEditable: true, labels })).toEqual([
			{ label: "Clear", name: "clear" },
			{ label: "Remove Australia", name: "remove:au" },
			{ label: "Remove Fiji", name: "remove:fj" },
		]);
	});

	test("clear only when it is drawn", () => {
		const names = resolveComboboxTriggerActions({ canClear: false, chips, isEditable: true, labels }).map(
			(a) => a.name
		);
		expect(names).toEqual(["remove:au", "remove:fj"]);
	});

	test("offers nothing while read-only or disabled", () => {
		expect(resolveComboboxTriggerActions({ canClear: true, chips, isEditable: false, labels })).toEqual([]);
	});

	test("names stay unique when labels repeat", () => {
		const dupes = [
			{ label: "Same", value: "a" },
			{ label: "Same", value: "b" },
		];
		const names = resolveComboboxTriggerActions({ canClear: false, chips: dupes, isEditable: true, labels }).map(
			(a) => a.name
		);
		expect(new Set(names).size).toBe(2);
	});
});

describe("resolveComboboxTriggerActionOutcome", () => {
	const actions = [
		{ label: "Clear", name: "clear" },
		{ label: "Remove Fiji", name: "remove:fj" },
	];

	test("maps clear and remove to their outcome", () => {
		expect(resolveComboboxTriggerActionOutcome("clear", actions)).toEqual({ type: "clear" });
		expect(resolveComboboxTriggerActionOutcome("remove:fj", actions)).toEqual({ type: "remove", value: "fj" });
	});

	test("ignores a name that was not offered", () => {
		expect(resolveComboboxTriggerActionOutcome("remove:au", actions)).toEqual({ type: "none" });
		expect(resolveComboboxTriggerActionOutcome("activate", actions)).toEqual({ type: "none" });
	});
});

describe("resolveComboboxTriggerLabel", () => {
	const triggerInField = (field: string, placeholder: string) => `${field}, ${placeholder}`;

	test("composes the field name with a shown placeholder", () => {
		expect(
			resolveComboboxTriggerLabel({
				hasValue: false,
				label: "Country",
				placeholder: "Choose a country",
				triggerInField,
			})
		).toBe("Country, Choose a country");
	});

	test("a shown value stays in the value, not the name", () => {
		expect(
			resolveComboboxTriggerLabel({ hasValue: true, label: "Country", placeholder: "Choose a country", triggerInField })
		).toBe("Country");
	});

	test("no composition when the label already holds the placeholder or either is missing", () => {
		const base = { hasValue: false, triggerInField };
		expect(resolveComboboxTriggerLabel({ ...base, label: "Pick", placeholder: "Pick" })).toBe("Pick");
		expect(resolveComboboxTriggerLabel({ ...base, label: "Pick a country", placeholder: "country" })).toBe(
			"Pick a country"
		);
		expect(resolveComboboxTriggerLabel({ ...base, label: undefined, placeholder: "Pick" })).toBe("Pick");
		expect(resolveComboboxTriggerLabel({ ...base, label: "Country", placeholder: undefined })).toBe("Country");
		expect(resolveComboboxTriggerLabel({ ...base, label: undefined, placeholder: undefined })).toBeUndefined();
	});
});

describe("resolveComboboxTriggerHitSlop", () => {
	test("the heights restate the --spacing-input-* defaults", () => {
		expect(COMBOBOX_TRIGGER_HEIGHTS).toEqual({ lg: 52, md: 44, sm: 36 });
		for (const size of INPUT_SIZES) {
			const px = TOKENS_CSS.match(new RegExp(`--spacing-input-${size}:\\s*(\\d+)px`))?.[1];
			expect(Number(px)).toBe(COMBOBOX_TRIGGER_HEIGHTS[size]);
		}
	});

	test("names the token of the size", () => {
		expect(comboboxTriggerHeightVariable("sm")).toBe("--spacing-input-sm");
		expect(comboboxTriggerHeightVariable("lg")).toBe("--spacing-input-lg");
	});

	test("grows vertically only, to the minimum", () => {
		expect(resolveComboboxTriggerHitSlop(36)).toEqual({ bottom: 4, left: 0, right: 0, top: 4 });
		expect(resolveComboboxTriggerHitSlop(36, 48)).toEqual({ bottom: 6, left: 0, right: 0, top: 6 });
	});

	test("follows a denser theme's height", () => {
		expect(resolveComboboxTriggerHitSlop(32)).toEqual({ bottom: 6, left: 0, right: 0, top: 6 });
		expect(resolveComboboxTriggerHitSlop(36)).toEqual({ bottom: 4, left: 0, right: 0, top: 4 });
	});

	test("nothing when already at the minimum", () => {
		expect(resolveComboboxTriggerHitSlop(44)).toBeUndefined();
		expect(resolveComboboxTriggerHitSlop(52)).toBeUndefined();
	});
});
