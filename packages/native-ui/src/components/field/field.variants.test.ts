import { describe, expect, test } from "bun:test";
import { TEXT_COLORS } from "../text/text.variants";
import {
	FIELD_LEGEND_VARIANTS,
	FIELD_ORIENTATIONS,
	FIELD_TEXT_PARTS,
	type FieldTextPart,
	fieldVariants,
	resolveFieldInteractive,
	resolveFieldTextColor,
} from "./field.variants";

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * A slot that emits nothing returns `undefined` rather than `""`, which is
 * correct — these parts carry state only, so most are empty most of the time —
 * but it makes a bare `not.toMatch()` throw rather than pass.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The gap step a class string sets — `gap-1.5` yields 1.5. */
function gapStep(cls: string): number | undefined {
	const value = cls.match(/\bgap-(\d+(?:\.\d+)?)\b/)?.[1];
	return value === undefined ? undefined : Number(value);
}

/** Slots that land on a `View`, which cannot cascade colour to a `Text`. */
const VIEW_SLOTS = ["root", "set", "group", "content", "separator"] as const;

/** Slots handed to a `Text`, whose type scale comes from the preset, not from here. */
const TEXT_SLOTS = ["label", "description", "error"] as const;

describe("the root slot", () => {
	test("lays a field out on one axis or the other, never both", () => {
		expect(fieldVariants({ orientation: "vertical" }).root()).toContain("flex-col");
		expect(fieldVariants({ orientation: "vertical" }).root()).not.toContain("flex-row");
		expect(fieldVariants({ orientation: "horizontal" }).root()).toContain("flex-row");
		expect(fieldVariants({ orientation: "horizontal" }).root()).not.toContain("flex-col");
	});

	test("centres a horizontal field on its control", () => {
		expect(fieldVariants({ orientation: "horizontal" }).root()).toContain("items-center");
	});

	// The control belongs at the far edge, and the root pushes it there rather
	// than the label growing into the space — a label that grew would stretch
	// vertically the moment it moved inside a `Field.Content` column.
	test("pushes a horizontal field's control to the far edge", () => {
		expect(fieldVariants({ orientation: "horizontal" }).root()).toContain("justify-between");
		expect(fieldVariants({ orientation: "vertical" }).root()).not.toContain("justify-between");
	});

	test("stacks vertically by default", () => {
		expect(fieldVariants().root()).toBe(fieldVariants({ orientation: "vertical" }).root());
	});

	test("merges an incoming className last", () => {
		expect(fieldVariants().root({ className: "mb-6" })).toContain("mb-6");
		expect(fieldVariants().root({ className: "gap-8" })).not.toContain("gap-1.5");
	});
});

// A React Native `View` does not cascade colour to a `Text` descendant, so no
// slot worn by one may carry a colour. See AGENTS.md rule 1.
describe("the slots that land on a View", () => {
	test("carry no text colour", () => {
		for (const orientation of FIELD_ORIENTATIONS) {
			for (const isInvalid of [false, true]) {
				for (const isDisabled of [false, true]) {
					const slots = fieldVariants({ isDisabled, isInvalid, orientation });
					for (const slot of VIEW_SLOTS) {
						expect(cls(slots[slot]())).not.toMatch(/\btext-/);
					}
				}
			}
		}
	});
});

// The whole reason four different gaps exist: a field's own parts have to read
// as one thing, and two fields as two. Pinning the ordering rather than each
// number keeps the test meaningful when the spacing is retuned.
describe("the gap ladder", () => {
	test("tightens inward, from field to field down to label and description", () => {
		const slots = fieldVariants();
		const content = gapStep(slots.content());
		const root = gapStep(slots.root());
		const set = gapStep(slots.set());
		const group = gapStep(slots.group());

		for (const gap of [content, root, set, group]) {
			expect(gap).toBeDefined();
		}
		expect(content as number).toBeLessThan(root as number);
		expect(root as number).toBeLessThan(set as number);
		expect(set as number).toBeLessThanOrEqual(group as number);
	});
});

describe("a disabled field", () => {
	test("fades the label", () => {
		expect(cls(fieldVariants({ isDisabled: true }).label())).toContain("opacity-50");
		expect(cls(fieldVariants({ isDisabled: false }).label())).not.toContain("opacity-50");
	});

	// The control fades itself, and a description dimmed on top of an already
	// dimmed control reads as two problems rather than one state.
	test("leaves the description and the error alone", () => {
		expect(cls(fieldVariants({ isDisabled: true }).description())).not.toContain("opacity-50");
		expect(cls(fieldVariants({ isDisabled: true }).error())).not.toContain("opacity-50");
	});
});

// The type scale belongs to the `Text` preset each part renders. A size or a
// weight here would be a second definition of `Text.Label` that could drift
// from it — the reason `Input` ships no label part at all. See AGENTS.md.
describe("the slots handed to a Text", () => {
	test("restate no type scale", () => {
		for (const isInvalid of [false, true]) {
			for (const isDisabled of [false, true]) {
				const slots = fieldVariants({ isDisabled, isInvalid });
				for (const slot of TEXT_SLOTS) {
					expect(cls(slots[slot]())).not.toMatch(/\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/);
					expect(cls(slots[slot]())).not.toMatch(/\bfont-(normal|medium|semibold|bold)\b/);
				}
			}
		}
	});

	test("carry no colour either, since that rides the preset's own axis", () => {
		for (const isInvalid of [false, true]) {
			const slots = fieldVariants({ isInvalid });
			for (const slot of TEXT_SLOTS) {
				expect(cls(slots[slot]())).not.toMatch(/\btext-\w+-?\w*\b/);
			}
		}
	});
});

describe("the legend", () => {
	test("gives its two variants different treatments", () => {
		const seen = new Set(FIELD_LEGEND_VARIANTS.map((variant) => cls(fieldVariants({ variant }).legend())));
		expect(seen.size).toBe(FIELD_LEGEND_VARIANTS.length);
	});

	test("merges an incoming className last", () => {
		expect(cls(fieldVariants().legend({ className: "mb-2" }))).toContain("mb-2");
	});
});

describe("the separator", () => {
	test("lays its rules out in a row", () => {
		expect(fieldVariants().separator()).toContain("flex-row");
		expect(fieldVariants().separator()).toContain("items-center");
	});

	// Each rule takes half the leftover width so a centred label sits between
	// them, rather than one rule being positioned behind an opaque label.
	test("lets each rule take the space the label does not", () => {
		expect(fieldVariants().separatorLine()).toContain("flex-1");
	});
});

describe("resolveFieldTextColor", () => {
	test("names a colour the Text component actually has, or nothing", () => {
		for (const part of FIELD_TEXT_PARTS) {
			for (const isInvalid of [false, true]) {
				const color = resolveFieldTextColor(part, isInvalid);
				if (color !== undefined) {
					expect(TEXT_COLORS).toContain(color);
				}
			}
		}
	});

	// The label turns with the control it names; the description stays muted so
	// the error is the one line that changed.
	test("reddens the label only while the field is invalid", () => {
		expect(resolveFieldTextColor("label", true)).toBe("destructive");
		expect(resolveFieldTextColor("label", false)).toBeUndefined();
	});

	test("leaves the description on its preset's own colour in both states", () => {
		for (const isInvalid of [false, true]) {
			expect(resolveFieldTextColor("description", isInvalid)).toBeUndefined();
		}
	});

	test("keeps the error destructive even outside an invalid field", () => {
		for (const isInvalid of [false, true]) {
			expect(resolveFieldTextColor("error", isInvalid)).toBe("destructive");
		}
	});

	test("covers every part it declares", () => {
		for (const part of FIELD_TEXT_PARTS) {
			expect(() => resolveFieldTextColor(part as FieldTextPart, true)).not.toThrow();
		}
	});
});

describe("resolveFieldInteractive", () => {
	test("leaves a field of static text inert", () => {
		// No control has offered a press, so the row stays a View. Mounting a
		// gesture detector under every label and description in a form would
		// announce static text as something you can activate.
		expect(resolveFieldInteractive(null)).toBe(false);
	});

	test("hands the row to a control that offered one", () => {
		expect(resolveFieldInteractive(() => undefined)).toBe(true);
	});
});
