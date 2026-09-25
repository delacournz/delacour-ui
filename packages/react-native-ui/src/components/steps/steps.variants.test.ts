import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEXT_SIZES } from "../text/text.variants";
import {
	isConnectorComplete,
	resolveIndicatorForeground,
	resolveIndicatorGlyph,
	resolveStepAccessibilityValue,
	resolveStepConnectors,
	resolveStepInteraction,
	resolveStepStatus,
	resolveStepsReadOnly,
	STEP_STATUSES,
	STEPS_DEFAULT_ORIENTATION,
	STEPS_DEFAULT_SIZE,
	STEPS_DEFAULT_VARIANT,
	STEPS_DESCRIPTION_TEXT_SIZE,
	STEPS_ORIENTATIONS,
	STEPS_SIZES,
	STEPS_TITLE_TEXT_SIZE,
	STEPS_VARIANTS,
	shouldEmitStep,
	stepsVariants,
} from "./steps.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");
const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** Tailwind's own spacing scale, in points. `size-8` is thirty-two. */
const SPACING_STEP_PX = 4;

/** Tailwind v4's default line heights, in points — `tokens.css` overrides sizes, not leading. */
const LINE_HEIGHT_PX: Record<string, number> = { xs: 16, sm: 20, base: 24, lg: 28, xl: 28 };

/** The `text-*` utility each `Text` size step emits. */
const TEXT_UTILITY: Record<string, string> = { xs: "xs", sm: "sm", md: "base", lg: "lg", xl: "xl" };

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The step a `prefix-N` class sets — `size-8` with `size` yields 8. */
function step(value: string, prefix: string): number {
	const found = value.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`))?.[1];
	if (found === undefined) throw new Error(`no ${prefix}-* in "${value}"`);
	return Number(found);
}

/** Every combination of the axes that paint an indicator, as `tv` props. */
function everyCell() {
	const cells = [];
	for (const variant of STEPS_VARIANTS) {
		for (const status of STEP_STATUSES) {
			for (const isInvalid of [false, true]) {
				cells.push({ variant, status, isInvalid });
			}
		}
	}
	return cells;
}

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(STEPS_VARIANTS).toEqual(["primary", "secondary"]);
		expect(STEPS_SIZES).toEqual(["sm", "md", "lg"]);
		expect(STEPS_ORIENTATIONS).toEqual(["horizontal", "vertical"]);
		expect(STEP_STATUSES).toEqual(["completed", "current", "upcoming"]);
	});

	test("the named defaults match tv's defaultVariants", () => {
		const fromDefaults = stepsVariants();
		const named = stepsVariants({
			orientation: STEPS_DEFAULT_ORIENTATION,
			size: STEPS_DEFAULT_SIZE,
			variant: STEPS_DEFAULT_VARIANT,
		});
		for (const slot of ["root", "item", "track", "indicator", "content", "title"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});

	test("every text size a step hands its parts is one Text has", () => {
		for (const size of STEPS_SIZES) {
			expect(TEXT_SIZES).toContain(STEPS_TITLE_TEXT_SIZE[size]);
			expect(TEXT_SIZES).toContain(STEPS_DESCRIPTION_TEXT_SIZE[size]);
		}
	});

	test("tokens.css still defines the text steps the offset maths assumes", () => {
		for (const size of STEPS_SIZES) {
			expect(TOKENS_CSS).toContain(`--text-${TEXT_UTILITY[STEPS_TITLE_TEXT_SIZE[size]]}:`);
		}
	});
});

describe("resolveStepStatus", () => {
	test("before the value is completed, at it is current, after it is upcoming", () => {
		expect(resolveStepStatus({ step: 0, value: 1 })).toBe("completed");
		expect(resolveStepStatus({ step: 1, value: 1 })).toBe("current");
		expect(resolveStepStatus({ step: 2, value: 1 })).toBe("upcoming");
	});

	test("completed: true wins everywhere, including on the current step", () => {
		expect(resolveStepStatus({ step: 3, value: 1, completed: true })).toBe("completed");
		expect(resolveStepStatus({ step: 1, value: 1, completed: true })).toBe("completed");
	});

	test("completed: false un-completes a passed step but never demotes the current one", () => {
		expect(resolveStepStatus({ step: 0, value: 2, completed: false })).toBe("upcoming");
		expect(resolveStepStatus({ step: 2, value: 2, completed: false })).toBe("current");
	});

	test("a value past the end completes every step", () => {
		for (const s of [0, 1, 2]) expect(resolveStepStatus({ step: s, value: 3 })).toBe("completed");
	});
});

describe("isConnectorComplete", () => {
	test("the line leaving a step fills once the value has moved past that step", () => {
		expect(isConnectorComplete(0, 0)).toBe(false);
		expect(isConnectorComplete(0, 1)).toBe(true);
		expect(isConnectorComplete(1, 1)).toBe(false);
		expect(isConnectorComplete(1, 3)).toBe(true);
	});
});

describe("resolveStepConnectors", () => {
	test("horizontal: every step draws both halves, the ends as spacers so indicators stay centred", () => {
		expect(resolveStepConnectors({ step: 0, count: 3, orientation: "horizontal" })).toEqual({
			leading: "spacer",
			trailing: "line",
		});
		expect(resolveStepConnectors({ step: 1, count: 3, orientation: "horizontal" })).toEqual({
			leading: "line",
			trailing: "line",
		});
		expect(resolveStepConnectors({ step: 2, count: 3, orientation: "horizontal" })).toEqual({
			leading: "line",
			trailing: "spacer",
		});
	});

	test("vertical: one trailing line per step, none after the last and none leading", () => {
		expect(resolveStepConnectors({ step: 0, count: 3, orientation: "vertical" })).toEqual({
			leading: "none",
			trailing: "line",
		});
		expect(resolveStepConnectors({ step: 2, count: 3, orientation: "vertical" })).toEqual({
			leading: "none",
			trailing: "none",
		});
	});

	test("a lone step draws no line in either orientation", () => {
		expect(resolveStepConnectors({ step: 0, count: 1, orientation: "horizontal" })).toEqual({
			leading: "spacer",
			trailing: "spacer",
		});
		expect(resolveStepConnectors({ step: 0, count: 1, orientation: "vertical" })).toEqual({
			leading: "none",
			trailing: "none",
		});
	});
});

describe("resolveStepsReadOnly", () => {
	test("a controlled value with no callback is read-only", () => {
		expect(resolveStepsReadOnly({ isControlled: true, hasOnValueChange: false })).toBe(true);
	});

	test("uncontrolled, or controlled with a callback, is interactive", () => {
		expect(resolveStepsReadOnly({ isControlled: false, hasOnValueChange: false })).toBe(false);
		expect(resolveStepsReadOnly({ isControlled: true, hasOnValueChange: true })).toBe(false);
	});

	test("an explicit isReadOnly wins either way", () => {
		expect(resolveStepsReadOnly({ isControlled: true, hasOnValueChange: true, isReadOnly: true })).toBe(true);
		expect(resolveStepsReadOnly({ isControlled: true, hasOnValueChange: false, isReadOnly: false })).toBe(false);
	});
});

describe("resolveStepInteraction", () => {
	const base = { isReadOnly: false, isLinear: false, isDisabled: false, isLoading: false, step: 2, value: 1 };

	test("read-only steps are static, whatever else is true", () => {
		expect(resolveStepInteraction({ ...base, isReadOnly: true })).toBe("static");
		expect(resolveStepInteraction({ ...base, isReadOnly: true, isDisabled: true })).toBe("static");
	});

	test("an interactive step is pressable", () => {
		expect(resolveStepInteraction(base)).toBe("pressable");
	});

	test("disabled and loading steps are blocked", () => {
		expect(resolveStepInteraction({ ...base, isDisabled: true })).toBe("blocked");
		expect(resolveStepInteraction({ ...base, isLoading: true })).toBe("blocked");
	});

	test("linear blocks only the steps ahead of the value", () => {
		expect(resolveStepInteraction({ ...base, isLinear: true, step: 2, value: 1 })).toBe("blocked");
		expect(resolveStepInteraction({ ...base, isLinear: true, step: 1, value: 1 })).toBe("pressable");
		expect(resolveStepInteraction({ ...base, isLinear: true, step: 0, value: 1 })).toBe("pressable");
	});
});

describe("shouldEmitStep", () => {
	test("re-pressing the current step is not a change", () => {
		expect(shouldEmitStep(1, 1)).toBe(false);
		expect(shouldEmitStep(1, 2)).toBe(true);
	});
});

describe("resolveStepAccessibilityValue", () => {
	test("announces position and status, one-based", () => {
		expect(resolveStepAccessibilityValue({ step: 1, count: 3, status: "completed" })).toBe("Step 2 of 3, completed");
		expect(resolveStepAccessibilityValue({ step: 0, count: 3, status: "current" })).toBe("Step 1 of 3, current");
		expect(resolveStepAccessibilityValue({ step: 2, count: 3, status: "upcoming" })).toBe("Step 3 of 3, upcoming");
	});

	test("appends error and loading, in that order", () => {
		expect(
			resolveStepAccessibilityValue({ step: 0, count: 2, status: "current", isInvalid: true, isLoading: true })
		).toBe("Step 1 of 2, current, has an error, loading");
	});

	test("an unknown count drops the total rather than saying 'of 0'", () => {
		expect(resolveStepAccessibilityValue({ step: 0, count: 0, status: "current" })).toBe("Step 1, current");
	});
});

describe("resolveIndicatorGlyph", () => {
	test("loading outranks invalid, invalid outranks completed, completed outranks the number", () => {
		expect(resolveIndicatorGlyph({ step: 0, status: "completed", isInvalid: true, isLoading: true })).toEqual({
			kind: "spinner",
		});
		expect(resolveIndicatorGlyph({ step: 0, status: "completed", isInvalid: true, isLoading: false })).toEqual({
			kind: "alert",
		});
		expect(resolveIndicatorGlyph({ step: 0, status: "completed", isInvalid: false, isLoading: false })).toEqual({
			kind: "check",
		});
	});

	test("current and upcoming steps show their one-based number", () => {
		expect(resolveIndicatorGlyph({ step: 0, status: "current", isInvalid: false, isLoading: false })).toEqual({
			kind: "number",
			label: "1",
		});
		expect(resolveIndicatorGlyph({ step: 4, status: "upcoming", isInvalid: false, isLoading: false })).toEqual({
			kind: "number",
			label: "5",
		});
	});
});

describe("stepsVariants", () => {
	test("orientation lays the root and each item out along its own axis", () => {
		expect(cls(stepsVariants({ orientation: "horizontal" }).root())).toMatch(/\bflex-row\b/);
		expect(cls(stepsVariants({ orientation: "vertical" }).root())).toMatch(/\bflex-col\b/);
		expect(cls(stepsVariants({ orientation: "horizontal" }).item())).toMatch(/\bflex-1\b/);
		expect(cls(stepsVariants({ orientation: "horizontal" }).trigger())).toMatch(/\bitems-center\b/);
		expect(cls(stepsVariants({ orientation: "vertical" }).trigger())).toMatch(/\bflex-row\b/);
	});

	test("horizontal titles centre under their indicator", () => {
		expect(cls(stepsVariants({ orientation: "horizontal" }).content())).toMatch(/\bitems-center\b/);
		expect(cls(stepsVariants({ orientation: "horizontal" }).title())).toMatch(/\btext-center\b/);
		expect(cls(stepsVariants({ orientation: "vertical" }).title())).not.toMatch(/\btext-center\b/);
	});

	test("the connector is a line across the axis it joins", () => {
		expect(cls(stepsVariants({ orientation: "horizontal" }).connector())).toMatch(/\bh-0\.5\b/);
		expect(cls(stepsVariants({ orientation: "vertical" }).connector())).toMatch(/\bw-0\.5\b/);
	});

	test("a filled connector is primary, an empty one the border colour", () => {
		expect(cls(stepsVariants({ isConnectorComplete: true }).connector())).toMatch(/\bbg-primary\b/);
		expect(cls(stepsVariants({ isConnectorComplete: false }).connector())).toMatch(/\bbg-border\b/);
	});

	test("indicator sizes ascend", () => {
		const edges = STEPS_SIZES.map((size) => step(cls(stepsVariants({ size }).indicator()), "size"));
		expect(edges).toEqual([...edges].sort((a, b) => a - b));
		expect(new Set(edges).size).toBe(edges.length);
	});

	test("a vertical title's first line is centred on its indicator", () => {
		for (const size of STEPS_SIZES) {
			const slots = stepsVariants({ orientation: "vertical", size });
			const indicatorPx = step(cls(slots.indicator()), "size") * SPACING_STEP_PX;
			const paddingPx = step(cls(slots.content()), "pt") * SPACING_STEP_PX;
			const lineHeight = LINE_HEIGHT_PX[TEXT_UTILITY[STEPS_TITLE_TEXT_SIZE[size]]];
			expect(paddingPx).toBe((indicatorPx - lineHeight) / 2);
		}
	});

	test("every painted cell sets a border, a background and a foreground", () => {
		for (const cell of everyCell()) {
			const slots = stepsVariants(cell);
			const indicator = cls(slots.indicator());
			expect(indicator).toMatch(/\bborder-(primary|border|destructive|secondary|muted)\b/);
			expect(indicator).toMatch(/\bbg-(primary|transparent|muted|secondary|destructive)\b/);
			expect(cls(slots.indicatorLabel())).toMatch(/\btext-[a-z-]+-?foreground\b|\btext-foreground\b/);
		}
	});

	test("invalid outranks every status in both variants", () => {
		for (const variant of STEPS_VARIANTS) {
			for (const status of STEP_STATUSES) {
				const slots = stepsVariants({ variant, status, isInvalid: true });
				expect(cls(slots.indicator())).toMatch(/\bborder-destructive\b/);
				expect(cls(slots.indicator())).toMatch(/\bbg-destructive\b/);
				expect(cls(slots.title())).toMatch(/\btext-destructive\b/);
			}
		}
	});

	test("the indicator label's colour class is the token the icon and spinner are handed", () => {
		for (const cell of everyCell()) {
			const token = resolveIndicatorForeground(cell);
			expect(cls(stepsVariants(cell).indicatorLabel())).toMatch(new RegExp(`(^|\\s)text-${token}(\\s|$)`));
		}
	});

	test("every foreground token is one theme.css declares", () => {
		for (const cell of everyCell()) {
			expect(THEME_CSS).toContain(`--${resolveIndicatorForeground(cell)}:`);
		}
	});

	test("upcoming titles are muted; reached ones are not", () => {
		expect(cls(stepsVariants({ status: "upcoming" }).title())).toMatch(/\btext-muted-foreground\b/);
		expect(cls(stepsVariants({ status: "current" }).title())).toMatch(/\btext-foreground\b/);
		expect(cls(stepsVariants({ status: "completed" }).title())).toMatch(/\btext-foreground\b/);
	});

	test("disabled fades the indicator and the content, never the pressable trigger", () => {
		const slots = stepsVariants({ isDisabled: true });
		expect(cls(slots.indicator())).toMatch(/\bopacity-50\b/);
		expect(cls(slots.content())).toMatch(/\bopacity-50\b/);
		expect(cls(slots.trigger())).not.toMatch(/\bopacity-/);
		expect(cls(slots.item())).not.toMatch(/\bopacity-/);
	});

	test("a vertical panel's rail is exactly as wide as the indicator, so its line runs under the circle's centre", () => {
		for (const size of STEPS_SIZES) {
			const slots = stepsVariants({ hasPanel: true, orientation: "vertical", size });
			expect(step(cls(slots.rail()), "w")).toBe(step(cls(slots.indicator()), "size"));
		}
	});

	test("the panel row shares the trigger's gap, so the panel lines up under the title", () => {
		for (const size of STEPS_SIZES) {
			const slots = stepsVariants({ hasPanel: true, orientation: "vertical", size });
			expect(step(cls(slots.panelRow()), "gap")).toBe(step(cls(slots.trigger()), "gap"));
		}
	});

	test("with a panel the gap below a vertical step moves from the title to the panel", () => {
		for (const size of STEPS_SIZES) {
			const withPanel = stepsVariants({ hasPanel: true, isLast: false, orientation: "vertical", size });
			const without = stepsVariants({ hasPanel: false, isLast: false, orientation: "vertical", size });
			expect(cls(withPanel.content())).not.toMatch(/\bpb-[1-9]/);
			expect(cls(withPanel.track())).not.toMatch(/\bpb-[1-9]/);
			expect(step(cls(withPanel.panel()), "pb")).toBe(step(cls(without.content()), "pb"));
			expect(step(cls(withPanel.rail()), "pb")).toBe(step(cls(without.track()), "pb"));
		}
	});

	test("the last step's panel leaves no gap below it", () => {
		const slots = stepsVariants({ hasPanel: true, isLast: true, orientation: "vertical" });
		expect(cls(slots.panel())).not.toMatch(/\bpb-[1-9]/);
	});

	test("the last vertical step drops the gap its line would have filled", () => {
		const middle = cls(stepsVariants({ orientation: "vertical", isLast: false }).content());
		const last = cls(stepsVariants({ orientation: "vertical", isLast: true }).content());
		expect(middle).toMatch(/\bpb-\d/);
		expect(last).not.toMatch(/\bpb-[1-9]/);
	});

	test("a caller className is merged last", () => {
		expect(cls(stepsVariants().root({ className: "flex-col" }))).toMatch(/\bflex-col\b/);
		expect(cls(stepsVariants().root({ className: "flex-col" }))).not.toMatch(/\bflex-row\b/);
	});
});
