import { describe, expect, test } from "bun:test";
import { BUTTON_VARIANTS } from "../button/button.variants";
import {
	resolveToggleButtonAccessibility,
	resolveToggleButtonVariant,
	resolveToggleSelection,
	TOGGLE_BUTTON_APPEARANCE,
	TOGGLE_BUTTON_GROUP_LAYOUTS,
	TOGGLE_BUTTON_SELECTION_MODES,
	TOGGLE_BUTTON_VARIANTS,
	toggleButtonVariants,
} from "./toggle-button.variants";

describe("TOGGLE_BUTTON_APPEARANCE", () => {
	test("covers every variant, in both states", () => {
		expect(Object.keys(TOGGLE_BUTTON_APPEARANCE).sort()).toEqual([...TOGGLE_BUTTON_VARIANTS].sort());
	});

	test("names only button variants, so the button's own paint and foreground apply", () => {
		for (const variant of TOGGLE_BUTTON_VARIANTS) {
			expect(BUTTON_VARIANTS).toContain(TOGGLE_BUTTON_APPEARANCE[variant].off);
			expect(BUTTON_VARIANTS).toContain(TOGGLE_BUTTON_APPEARANCE[variant].on);
		}
	});

	test("a selected button never looks like an unselected one", () => {
		for (const variant of TOGGLE_BUTTON_VARIANTS) {
			expect(TOGGLE_BUTTON_APPEARANCE[variant].on).not.toBe(TOGGLE_BUTTON_APPEARANCE[variant].off);
		}
	});

	test("never paints a toggle destructive", () => {
		for (const variant of TOGGLE_BUTTON_VARIANTS) {
			for (const state of ["on", "off"] as const) {
				expect(TOGGLE_BUTTON_APPEARANCE[variant][state].startsWith("destructive")).toBe(false);
			}
		}
	});
});

describe("resolveToggleButtonVariant", () => {
	test("reads the appearance table", () => {
		expect(resolveToggleButtonVariant("default", false)).toBe("secondary");
		expect(resolveToggleButtonVariant("default", true)).toBe("primary");
		expect(resolveToggleButtonVariant("outline", false)).toBe("outline");
		expect(resolveToggleButtonVariant("outline", true)).toBe("primary");
		expect(resolveToggleButtonVariant("ghost", false)).toBe("ghost");
		expect(resolveToggleButtonVariant("ghost", true)).toBe("secondary");
	});
});

describe("resolveToggleSelection — multiple", () => {
	const mode = "multiple" as const;

	test("adds a value that was not selected, keeping press order", () => {
		expect(resolveToggleSelection({ current: ["bold"], selectionMode: mode, value: "italic" })).toEqual([
			"bold",
			"italic",
		]);
	});

	test("removes a value that was selected", () => {
		expect(resolveToggleSelection({ current: ["bold", "italic"], selectionMode: mode, value: "bold" })).toEqual([
			"italic",
		]);
	});

	test("clears the last value when a selection is not required", () => {
		expect(resolveToggleSelection({ current: ["bold"], selectionMode: mode, value: "bold" })).toEqual([]);
	});

	test("refuses to clear the last value when a selection is required", () => {
		expect(
			resolveToggleSelection({ current: ["bold"], isSelectionRequired: true, selectionMode: mode, value: "bold" })
		).toBeNull();
	});

	test("still removes one of several when a selection is required", () => {
		expect(
			resolveToggleSelection({
				current: ["bold", "italic"],
				isSelectionRequired: true,
				selectionMode: mode,
				value: "bold",
			})
		).toEqual(["italic"]);
	});

	test("does not mutate the list it was given", () => {
		const current = ["bold"];
		resolveToggleSelection({ current, selectionMode: mode, value: "italic" });
		resolveToggleSelection({ current, selectionMode: mode, value: "bold" });
		expect(current).toEqual(["bold"]);
	});
});

describe("resolveToggleSelection — single", () => {
	const mode = "single" as const;

	test("replaces the selection with the pressed value", () => {
		expect(resolveToggleSelection({ current: ["left"], selectionMode: mode, value: "center" })).toEqual(["center"]);
	});

	test("selects from nothing", () => {
		expect(resolveToggleSelection({ current: [], selectionMode: mode, value: "center" })).toEqual(["center"]);
	});

	test("a re-press clears the selection when one is not required", () => {
		expect(resolveToggleSelection({ current: ["left"], selectionMode: mode, value: "left" })).toEqual([]);
	});

	test("a re-press is no change when a selection is required", () => {
		expect(
			resolveToggleSelection({ current: ["left"], isSelectionRequired: true, selectionMode: mode, value: "left" })
		).toBeNull();
	});

	test("collapses a controlled list that arrived with several values", () => {
		expect(resolveToggleSelection({ current: ["left", "right"], selectionMode: mode, value: "center" })).toEqual([
			"center",
		]);
	});
});

describe("resolveToggleButtonAccessibility", () => {
	test("a standalone button is a toggle button that is checked or not", () => {
		expect(resolveToggleButtonAccessibility(null, true)).toEqual({
			accessibilityRole: "togglebutton",
			accessibilityState: { checked: true },
		});
		expect(resolveToggleButtonAccessibility(null, false)).toEqual({
			accessibilityRole: "togglebutton",
			accessibilityState: { checked: false },
		});
	});

	test("a member of a multiple-selection group is still a toggle button", () => {
		expect(resolveToggleButtonAccessibility("multiple", true)).toEqual({
			accessibilityRole: "togglebutton",
			accessibilityState: { checked: true },
		});
	});

	test("a member of a single-selection group is a radio, selected or not", () => {
		expect(resolveToggleButtonAccessibility("single", true)).toEqual({
			accessibilityRole: "radio",
			accessibilityState: { selected: true },
		});
		expect(resolveToggleButtonAccessibility("single", false)).toEqual({
			accessibilityRole: "radio",
			accessibilityState: { selected: false },
		});
	});
});

describe("toggleButtonVariants", () => {
	test("exposes both selection modes and both layouts", () => {
		expect([...TOGGLE_BUTTON_SELECTION_MODES]).toEqual(["single", "multiple"]);
		expect([...TOGGLE_BUTTON_GROUP_LAYOUTS]).toEqual(["attached", "detached"]);
	});

	test("an attached group adds nothing — Button.Group draws the run", () => {
		// `tv` returns undefined rather than "" for a slot with no classes.
		expect(toggleButtonVariants({ layout: "attached", orientation: "horizontal" }).group() ?? "").toBe("");
		expect(toggleButtonVariants({ layout: "attached", orientation: "vertical" }).group() ?? "").toBe("");
	});

	test("a detached horizontal group wraps with a gap", () => {
		const group = toggleButtonVariants({ layout: "detached", orientation: "horizontal" }).group();
		expect(group).toContain("flex-row");
		expect(group).toContain("flex-wrap");
		expect(group).toContain("gap-2");
	});

	test("a detached vertical group stacks with a gap", () => {
		const group = toggleButtonVariants({ layout: "detached", orientation: "vertical" }).group();
		expect(group).toContain("flex-col");
		expect(group).toContain("gap-2");
		expect(group).not.toContain("flex-row");
	});

	test("a caller's className merges over the group's own", () => {
		const group = toggleButtonVariants({ layout: "detached", orientation: "horizontal" }).group({
			className: "gap-4",
		});
		expect(group).toContain("gap-4");
		expect(group).not.toContain("gap-2");
	});
});
