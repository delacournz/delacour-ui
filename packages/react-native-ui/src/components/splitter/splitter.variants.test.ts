import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import {
	adjacentCollapsibleIndex,
	describeSplitterChildren,
	equalLayout,
	fitLayout,
	formatSplitterValue,
	isLayoutValid,
	isPaneCollapsed,
	isSeamHeld,
	layoutsEqual,
	lerpLayout,
	resolveCollapseToggle,
	resolveDrag,
	resolveDragEnd,
	resolveInitialLayout,
	resolveKeyboardStep,
	resolveSplitterAction,
	resolveSplitterStep,
	SPLITTER_DEFAULT_ORIENTATION,
	SPLITTER_DEFAULT_STEP,
	SPLITTER_DEFAULT_VARIANT,
	SPLITTER_DRAWS_LINE,
	SPLITTER_GRIP_ACTIVE_SCALE,
	SPLITTER_HANDLE_SIZE,
	SPLITTER_ORIENTATIONS,
	SPLITTER_PANES_GAP,
	SPLITTER_VARIANTS,
	type SplitterPaneConstraints,
	seamOffset,
	splitterVariants,
} from "./splitter.variants";

const SLOTS = ["root", "pane", "handle", "line", "grip"] as const;

function classes(className: string): string[] {
	return className.split(/\s+/).filter(Boolean);
}

function sum(layout: readonly number[]): number {
	return layout.reduce((total, size) => total + size, 0);
}

function expectLayout(actual: readonly number[], expected: readonly number[]): void {
	expect(actual.length).toBe(expected.length);
	for (let index = 0; index < expected.length; index++) {
		expect(actual[index]).toBeCloseTo(expected[index] as number, 9);
	}
}

/** Every slot's classes in every cell of the matrix, for the sweeps below. */
function everyClass(): string[] {
	const all: string[] = [];
	for (const orientation of SPLITTER_ORIENTATIONS) {
		for (const variant of SPLITTER_VARIANTS) {
			for (const isActive of [false, true]) {
				for (const isDisabled of [false, true]) {
					const slots = splitterVariants({ isActive, isDisabled, orientation, variant });
					for (const slot of SLOTS) all.push(...classes(slots[slot]()));
				}
			}
		}
	}
	return all;
}

describe("the axes", () => {
	test("name two orientations and two variants", () => {
		expect([...SPLITTER_ORIENTATIONS]).toEqual(["horizontal", "vertical"]);
		expect([...SPLITTER_VARIANTS]).toEqual(["seam", "panes"]);
	});

	test("default to a horizontal seam", () => {
		expect(SPLITTER_DEFAULT_ORIENTATION).toBe("horizontal");
		expect(SPLITTER_DEFAULT_VARIANT).toBe("seam");
		expect(classes(splitterVariants().root())).toContain("flex-row");
		expect(classes(splitterVariants().root())).not.toContain("gap-2");
	});
});

describe("splitterVariants", () => {
	test("flips the root's direction with the orientation", () => {
		expect(classes(splitterVariants({ orientation: "horizontal" }).root())).toContain("flex-row");
		expect(classes(splitterVariants({ orientation: "vertical" }).root())).toContain("flex-col");
	});

	test("gives panes a card surface with a continuous corner", () => {
		const pane = classes(splitterVariants({ variant: "panes" }).pane());
		for (const name of ["rounded-lg", "border", "border-border", "bg-card", "border-continuous", "overflow-hidden"]) {
			expect(pane).toContain(name);
		}
		expect(classes(splitterVariants({ variant: "seam" }).pane())).toEqual(["overflow-hidden"]);
	});

	// The gap is restated in points so a handle can find the middle of it. The two
	// numbers are one number; a retune of one without the other puts the grip on a pane.
	test("separates panes by the gap the handle is positioned against", () => {
		expect(classes(splitterVariants({ variant: "panes" }).root())).toContain("gap-2");
		expect(SPLITTER_PANES_GAP).toBe(2 * 4);
	});

	test("draws the hairline only between flush panes", () => {
		expect(SPLITTER_DRAWS_LINE).toEqual({ panes: false, seam: true });
		expect(classes(splitterVariants({ orientation: "horizontal", variant: "seam" }).line())).toEqual(
			expect.arrayContaining(["w-px", "h-full", "bg-border"])
		);
		expect(classes(splitterVariants({ orientation: "vertical", variant: "seam" }).line())).toEqual(
			expect.arrayContaining(["h-px", "w-full", "bg-border"])
		);
	});

	// 44pt is the minimum touch target. The handle is the whole of the control, so
	// a narrower box is a seam a thumb cannot find.
	test("makes the handle a 44pt touch box across the seam in both orientations", () => {
		expect(SPLITTER_HANDLE_SIZE).toBe(11 * 4);
		expect(classes(splitterVariants({ orientation: "horizontal" }).handle())).toEqual(
			expect.arrayContaining(["w-11", "h-full", "absolute"])
		);
		expect(classes(splitterVariants({ orientation: "vertical" }).handle())).toEqual(
			expect.arrayContaining(["h-11", "w-full", "absolute"])
		);
	});

	// A later sibling draws over an earlier one and takes its touches, so without
	// a z-index the trailing pane would cover half of every handle.
	test("lifts the handle above the trailing pane", () => {
		expect(classes(splitterVariants().handle())).toContain("z-10");
	});

	test("draws the grip as a capsule along the seam", () => {
		expect(classes(splitterVariants({ orientation: "horizontal" }).grip())).toEqual(
			expect.arrayContaining(["h-8", "w-1", "rounded-full", "bg-muted-foreground"])
		);
		expect(classes(splitterVariants({ orientation: "vertical" }).grip())).toEqual(
			expect.arrayContaining(["h-1", "w-8", "rounded-full"])
		);
	});

	test("darkens the grip while it is held and fades it while disabled", () => {
		const active = classes(splitterVariants({ isActive: true }).grip());
		expect(active).toContain("bg-foreground");
		expect(active).not.toContain("bg-muted-foreground");
		expect(classes(splitterVariants({ isDisabled: true }).grip())).toContain("opacity-50");
	});

	test("grows the held grip across the seam, not along it", () => {
		expect(SPLITTER_GRIP_ACTIVE_SCALE).toBe(1.25);
	});

	test("casts no shadow, names no size step and no raw palette colour anywhere", () => {
		const all = everyClass();
		expect(all.filter((name) => name.startsWith("shadow"))).toEqual([]);
		expect(all.filter((name) => name.startsWith("size-"))).toEqual([]);
		expect(
			all.filter((name) =>
				/^(bg|border|text)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/.test(
					name
				)
			)
		).toEqual([]);
	});

	test("names only tokens both variants of the theme declare", () => {
		const tokens = new Set(
			everyClass()
				.map((name) => name.match(/^(?:bg|border)-([a-z-]+)$/)?.[1])
				.filter((token): token is string => token !== undefined && token !== "continuous")
		);
		expect([...tokens].sort()).toEqual(["border", "card", "foreground", "muted-foreground"]);
		for (const token of tokens) expect(declarationCount(token)).toBe(2);
	});
});

describe("resolveSplitterStep", () => {
	test("keeps a step between zero and half the box", () => {
		expect(resolveSplitterStep(10)).toBe(10);
		expect(resolveSplitterStep(50)).toBe(50);
	});

	test("falls back to the default for anything else", () => {
		expect(SPLITTER_DEFAULT_STEP).toBe(5);
		for (const step of [undefined, 0, -1, 51, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(resolveSplitterStep(step)).toBe(SPLITTER_DEFAULT_STEP);
		}
	});
});

describe("equalLayout", () => {
	test("shares the box equally", () => {
		expectLayout(equalLayout(2), [50, 50]);
		expectLayout(equalLayout(4), [25, 25, 25, 25]);
		expect(equalLayout(0)).toEqual([]);
	});
});

describe("isLayoutValid", () => {
	test("accepts one finite, non-negative share per pane summing to 100", () => {
		expect(isLayoutValid([30, 70], 2)).toBe(true);
		expect(isLayoutValid([33.33, 33.33, 33.34], 3)).toBe(true);
	});

	test("rejects a length mismatch, a bad number or a wrong sum", () => {
		expect(isLayoutValid([50, 50], 3)).toBe(false);
		expect(isLayoutValid([50, Number.NaN], 2)).toBe(false);
		expect(isLayoutValid([-10, 110], 2)).toBe(false);
		expect(isLayoutValid([40, 40], 2)).toBe(false);
	});
});

describe("resolveInitialLayout", () => {
	test("shares the box equally with no sizes named", () => {
		expectLayout(resolveInitialLayout([{}, {}]), [50, 50]);
	});

	test("gives the remainder to the panes that name no size", () => {
		expectLayout(resolveInitialLayout([{ defaultSize: 30 }, {}]), [30, 70]);
		expectLayout(resolveInitialLayout([{ defaultSize: 30 }, { defaultSize: 30 }, {}]), [30, 30, 40]);
	});

	test("falls back to equal shares when the defaults overflow the box", () => {
		expectLayout(resolveInitialLayout([{ defaultSize: 70 }, { defaultSize: 70 }]), [50, 50]);
		expectLayout(resolveInitialLayout([{ defaultSize: 30 }, { defaultSize: 30 }]), [50, 50]);
	});

	test("falls back to equal shares when the floors cannot all fit", () => {
		expectLayout(resolveInitialLayout([{ minSize: 60 }, { minSize: 60 }]), [50, 50]);
	});

	test("respects a floor the equal share would break", () => {
		expectLayout(resolveInitialLayout([{ minSize: 60 }, {}]), [60, 40]);
	});

	test("prefers a valid layout the caller names", () => {
		expectLayout(resolveInitialLayout([{}, {}], [25, 75]), [25, 75]);
	});

	test("falls back to equal shares for an invalid one", () => {
		expectLayout(resolveInitialLayout([{}, {}], [25, 25]), [50, 50]);
		expectLayout(resolveInitialLayout([{}, {}], [100]), [50, 50]);
	});

	test("always sums to 100", () => {
		const cases: SplitterPaneConstraints[][] = [
			[{}, {}, {}],
			[{ defaultSize: 10 }, {}, {}],
			[{ minSize: 40 }, { maxSize: 10 }, {}],
		];
		for (const constraints of cases) expect(sum(resolveInitialLayout(constraints))).toBeCloseTo(100, 9);
	});
});

describe("fitLayout", () => {
	test("pulls each pane inside its bounds and keeps the sum", () => {
		const fitted = fitLayout([10, 90], [{ minSize: 20 }, {}]);
		expectLayout(fitted, [20, 80]);
	});

	test("keeps a collapsed pane collapsed", () => {
		expectLayout(fitLayout([0, 100], [{ isCollapsible: true, minSize: 20 }, {}]), [0, 100]);
	});
});

describe("resolveDrag", () => {
	test("moves the seam by the delta", () => {
		expectLayout(resolveDrag({ constraints: [{}, {}], delta: 10, handleIndex: 0, start: [50, 50] }), [60, 40]);
	});

	test("stops at the neighbour's floor", () => {
		expectLayout(
			resolveDrag({ constraints: [{}, { minSize: 45 }], delta: 10, handleIndex: 0, start: [50, 50] }),
			[55, 45]
		);
	});

	test("stops at the leading pane's floor", () => {
		expectLayout(
			resolveDrag({ constraints: [{ minSize: 20 }, {}], delta: -80, handleIndex: 0, start: [50, 50] }),
			[20, 80]
		);
	});

	test("stops at a ceiling", () => {
		expectLayout(
			resolveDrag({ constraints: [{ maxSize: 70 }, {}], delta: 40, handleIndex: 0, start: [50, 50] }),
			[70, 30]
		);
	});

	test("touches only the two panes either side of the handle", () => {
		const result = resolveDrag({
			constraints: [{}, {}, { minSize: 10 }],
			delta: 20,
			handleIndex: 1,
			start: [30, 40, 30],
		});
		expectLayout(result, [30, 60, 10]);
	});

	test("preserves the sum", () => {
		const cases = [
			resolveDrag({ constraints: [{}, {}], delta: 10, handleIndex: 0, start: [50, 50] }),
			resolveDrag({ constraints: [{}, { minSize: 45 }], delta: 10, handleIndex: 0, start: [50, 50] }),
			resolveDrag({ constraints: [{ minSize: 20 }, {}], delta: -80, handleIndex: 0, start: [50, 50] }),
			resolveDrag({ constraints: [{}, {}, { minSize: 10 }], delta: 20, handleIndex: 1, start: [30, 40, 30] }),
		];
		for (const layout of cases) expect(Math.abs(sum(layout) - 100)).toBeLessThan(1e-9);
	});

	describe("a collapsible pane", () => {
		const constraints: SplitterPaneConstraints[] = [{ collapsedSize: 0, isCollapsible: true, minSize: 20 }, {}];

		test("stops at its floor until the drag passes half of it", () => {
			expectLayout(resolveDrag({ constraints, delta: -12, handleIndex: 0, start: [30, 70] }), [20, 80]);
		});

		test("collapses past half of its floor", () => {
			expectLayout(resolveDrag({ constraints, delta: -25, handleIndex: 0, start: [30, 70] }), [0, 100]);
		});

		test("collapses its own collapsed size, not zero", () => {
			const held: SplitterPaneConstraints[] = [{ collapsedSize: 4, isCollapsible: true, minSize: 20 }, {}];
			expectLayout(resolveDrag({ constraints: held, delta: -25, handleIndex: 0, start: [30, 70] }), [4, 96]);
		});

		test("collapses on the trailing side too", () => {
			const trailing: SplitterPaneConstraints[] = [{}, { isCollapsible: true, minSize: 20 }];
			expectLayout(resolveDrag({ constraints: trailing, delta: 25, handleIndex: 0, start: [70, 30] }), [100, 0]);
			expectLayout(resolveDrag({ constraints: trailing, delta: 15, handleIndex: 0, start: [70, 30] }), [80, 20]);
		});

		test("reopens to its floor once dragged past half of it", () => {
			expectLayout(resolveDrag({ constraints, delta: 5, handleIndex: 0, start: [0, 100] }), [0, 100]);
			expectLayout(resolveDrag({ constraints, delta: 12, handleIndex: 0, start: [0, 100] }), [20, 80]);
			expectLayout(resolveDrag({ constraints, delta: 30, handleIndex: 0, start: [0, 100] }), [30, 70]);
		});
	});

	test("returns the start values for no movement", () => {
		expectLayout(
			resolveDrag({ constraints: [{ minSize: 60 }, {}], delta: 0, handleIndex: 0, start: [50, 50] }),
			[50, 50]
		);
		expectLayout(resolveDrag({ constraints: [{}, {}], delta: Number.NaN, handleIndex: 0, start: [50, 50] }), [50, 50]);
	});

	test("ignores a handle that has no pane after it", () => {
		expectLayout(resolveDrag({ constraints: [{}, {}], delta: 10, handleIndex: 1, start: [50, 50] }), [50, 50]);
	});
});

describe("isSeamHeld", () => {
	test("reports a drag a constraint stopped", () => {
		const constraints: SplitterPaneConstraints[] = [{ minSize: 20 }, {}];
		const start = [50, 50];
		const held = resolveDrag({ constraints, delta: -40, handleIndex: 0, start });
		const free = resolveDrag({ constraints, delta: -10, handleIndex: 0, start });
		expect(isSeamHeld({ delta: -40, handleIndex: 0, layout: held, start })).toBe(true);
		expect(isSeamHeld({ delta: -10, handleIndex: 0, layout: free, start })).toBe(false);
	});
});

describe("resolveDragEnd", () => {
	test("rounds the released seam to the step", () => {
		expectLayout(
			resolveDragEnd({ constraints: [{}, {}], delta: 12, handleIndex: 0, start: [50, 50], step: 5 }),
			[60, 40]
		);
	});

	test("rounds the seam rather than the pane, so a second handle lands on the grid", () => {
		expectLayout(
			resolveDragEnd({ constraints: [{}, {}, {}], delta: 1, handleIndex: 1, start: [33, 33, 34], step: 5 }),
			[33, 32, 35]
		);
	});

	test("keeps a floor that is off the grid", () => {
		expectLayout(
			resolveDragEnd({ constraints: [{ minSize: 22 }, {}], delta: -29, handleIndex: 0, start: [50, 50], step: 5 }),
			[22, 78]
		);
	});

	test("leaves a collapsed pane collapsed", () => {
		const constraints: SplitterPaneConstraints[] = [{ isCollapsible: true, minSize: 20 }, {}];
		expectLayout(resolveDragEnd({ constraints, delta: -22, handleIndex: 0, start: [30, 70], step: 5 }), [0, 100]);
	});
});

describe("resolveKeyboardStep", () => {
	test("moves the seam one step", () => {
		expectLayout(
			resolveKeyboardStep({ constraints: [{}, {}], direction: 1, handleIndex: 0, layout: [50, 50], step: 5 }),
			[55, 45]
		);
		expectLayout(
			resolveKeyboardStep({ constraints: [{}, {}], direction: -1, handleIndex: 0, layout: [50, 50], step: 5 }),
			[45, 55]
		);
	});

	test("returns the same layout at a ceiling", () => {
		const layout = [50, 50];
		const next = resolveKeyboardStep({
			constraints: [{ maxSize: 50 }, {}],
			direction: 1,
			handleIndex: 0,
			layout,
			step: 5,
		});
		expect(next).toBe(layout);
	});
});

describe("resolveCollapseToggle", () => {
	const constraints: SplitterPaneConstraints[] = [{ collapsedSize: 0, isCollapsible: true, minSize: 20 }, {}];

	test("collapses an open pane and lets the neighbour absorb it", () => {
		expectLayout(resolveCollapseToggle({ constraints, index: 0, layout: [30, 70] }), [0, 100]);
	});

	test("collapses even when the collapsed size is above half the floor", () => {
		const held: SplitterPaneConstraints[] = [{ collapsedSize: 15, isCollapsible: true, minSize: 20 }, {}];
		expectLayout(resolveCollapseToggle({ constraints: held, index: 0, layout: [30, 70] }), [15, 85]);
	});

	test("restores a collapsed pane to its default size", () => {
		const sized: SplitterPaneConstraints[] = [{ defaultSize: 35, isCollapsible: true, minSize: 20 }, {}];
		expectLayout(resolveCollapseToggle({ constraints: sized, index: 0, layout: [0, 100] }), [35, 65]);
	});

	test("restores to the floor when there is no default", () => {
		expectLayout(resolveCollapseToggle({ constraints, index: 0, layout: [0, 100] }), [20, 80]);
	});

	test("restores to an equal share when there is neither", () => {
		const bare: SplitterPaneConstraints[] = [{ isCollapsible: true }, {}];
		expectLayout(resolveCollapseToggle({ constraints: bare, index: 0, layout: [0, 100] }), [50, 50]);
	});

	test("lets the leading neighbour absorb the last pane", () => {
		const trailing: SplitterPaneConstraints[] = [{}, { isCollapsible: true, minSize: 20 }];
		expectLayout(resolveCollapseToggle({ constraints: trailing, index: 1, layout: [70, 30] }), [100, 0]);
	});

	test("does nothing for a pane that cannot collapse", () => {
		const layout = [30, 70];
		expect(resolveCollapseToggle({ constraints: [{}, {}], index: 0, layout })).toBe(layout);
	});

	test("does nothing when no neighbour can absorb it", () => {
		const layout = [30, 70];
		const capped: SplitterPaneConstraints[] = [{ isCollapsible: true }, { maxSize: 70 }];
		expect(resolveCollapseToggle({ constraints: capped, index: 0, layout })).toBe(layout);
	});
});

describe("isPaneCollapsed and adjacentCollapsibleIndex", () => {
	const constraints: SplitterPaneConstraints[] = [{ isCollapsible: true, minSize: 20 }, {}, {}];

	test("reads a collapsible pane at its collapsed size as collapsed", () => {
		expect(isPaneCollapsed([0, 50, 50], 0, constraints)).toBe(true);
		expect(isPaneCollapsed([30, 35, 35], 0, constraints)).toBe(false);
		expect(isPaneCollapsed([0, 50, 50], 1, constraints)).toBe(false);
	});

	test("finds the collapsible pane beside a handle, leading side first", () => {
		expect(adjacentCollapsibleIndex(0, constraints)).toBe(0);
		expect(adjacentCollapsibleIndex(1, constraints)).toBe(-1);
		expect(adjacentCollapsibleIndex(1, [{}, {}, { isCollapsible: true }])).toBe(2);
	});
});

describe("seamOffset", () => {
	test("places a seam at its share of the box", () => {
		expect(seamOffset({ extent: 400, gap: 0, index: 0, sizes: [30, 70] })).toBeCloseTo(120, 9);
		expect(seamOffset({ extent: 300, gap: 0, index: 1, sizes: [20, 30, 50] })).toBeCloseTo(150, 9);
	});

	test("places a seam in the middle of the gap between surfaces", () => {
		expect(seamOffset({ extent: 408, gap: 8, index: 0, sizes: [50, 50] })).toBeCloseTo(204, 9);
		expect(seamOffset({ extent: 416, gap: 8, index: 1, sizes: [25, 25, 50] })).toBeCloseTo(212, 9);
	});

	test("answers zero before the box has been measured", () => {
		expect(seamOffset({ extent: 0, gap: 8, index: 0, sizes: [50, 50] })).toBe(0);
	});
});

describe("lerpLayout and layoutsEqual", () => {
	test("interpolates every pane", () => {
		expectLayout(lerpLayout([20, 80], [60, 40], 0.5), [40, 60]);
		expectLayout(lerpLayout([20, 80], [60, 40], 1), [60, 40]);
	});

	test("jumps when the pane count changed", () => {
		expectLayout(lerpLayout([50, 50], [30, 30, 40], 0.2), [30, 30, 40]);
	});

	test("compares element-wise", () => {
		expect(layoutsEqual([50, 50], [50, 50])).toBe(true);
		expect(layoutsEqual([50, 50], [50, 50.1])).toBe(false);
		expect(layoutsEqual([50, 50], [50, 50, 0])).toBe(false);
	});
});

describe("formatSplitterValue", () => {
	test("reads a whole percent", () => {
		expect(formatSplitterValue(35)).toBe("35 percent");
		expect(formatSplitterValue(33.333)).toBe("33 percent");
	});
});

describe("describeSplitterChildren", () => {
	test("accepts panes alternating with handles", () => {
		expect(describeSplitterChildren(["pane", "handle", "pane"])).toBeNull();
		expect(describeSplitterChildren(["pane", "handle", "pane", "handle", "pane"])).toBeNull();
	});

	test("names what is wrong otherwise", () => {
		expect(describeSplitterChildren(["pane"])).toMatch(/two/);
		expect(describeSplitterChildren(["handle", "pane"])).toMatch(/start/);
		expect(describeSplitterChildren(["pane", "handle"])).toMatch(/end/);
		expect(describeSplitterChildren(["pane", "pane"])).toMatch(/alternate/);
		expect(describeSplitterChildren(["pane", "other", "pane"])).toMatch(/Splitter\.Pane/);
	});
});

describe("resolveSplitterAction", () => {
	const constraints = [{ collapsedSize: 0, isCollapsible: true, minSize: 20 }, {}];

	test("increment and decrement step the seam", () => {
		expect(
			resolveSplitterAction({ constraints, handleIndex: 0, layout: [50, 50], name: "increment", step: 5 })
		).toEqual({
			kind: "apply",
			layout: [55, 45],
		});
		expect(
			resolveSplitterAction({ constraints, handleIndex: 0, layout: [50, 50], name: "decrement", step: 5 })
		).toEqual({
			kind: "apply",
			layout: [45, 55],
		});
	});

	test("a step a bound stops is no action", () => {
		expect(
			resolveSplitterAction({
				constraints: [{}, { minSize: 50 }],
				handleIndex: 0,
				layout: [50, 50],
				name: "increment",
				step: 5,
			})
		).toBeNull();
	});

	test("reset resets", () => {
		expect(resolveSplitterAction({ constraints, handleIndex: 0, layout: [50, 50], name: "reset", step: 5 })).toEqual({
			kind: "reset",
		});
	});

	test("collapse and expand toggle the adjacent collapsible pane", () => {
		expect(resolveSplitterAction({ constraints, handleIndex: 0, layout: [50, 50], name: "collapse", step: 5 })).toEqual(
			{
				index: 0,
				kind: "toggle",
			}
		);
		expect(resolveSplitterAction({ constraints, handleIndex: 0, layout: [0, 100], name: "expand", step: 5 })).toEqual({
			index: 0,
			kind: "toggle",
		});
	});

	test("collapse beside no collapsible pane, or an unknown action, is nothing", () => {
		expect(
			resolveSplitterAction({ constraints: [{}, {}], handleIndex: 0, layout: [50, 50], name: "collapse", step: 5 })
		).toBeNull();
		expect(
			resolveSplitterAction({ constraints, handleIndex: 0, layout: [50, 50], name: "activate", step: 5 })
		).toBeNull();
	});
});
