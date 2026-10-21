import { describe, expect, test } from "bun:test";
import { THEME_CSS } from "../../styles/theme-tokens.test";
import {
	clampAutoscrollStep,
	computeOffsets,
	reorderItems,
	resolveAutoscrollStep,
	resolveMoveAction,
	resolveShifts,
	resolveSortableHaptics,
	resolveSortablePosition,
	resolveTargetIndex,
	SORTABLE_ACTIVATIONS,
	SORTABLE_DEFAULT_ACTIVATION,
	SORTABLE_DEFAULT_AUTOSCROLL_SPEED,
	SORTABLE_DEFAULT_AUTOSCROLL_THRESHOLD,
	SORTABLE_DEFAULT_HAPTIC,
	SORTABLE_DEFAULT_LONG_PRESS_DELAY,
	SORTABLE_HANDLE_ICON_TOKEN,
	SORTABLE_LIFT_DURATION,
	SORTABLE_LIFT_SCALE,
	SORTABLE_SHIFT_SPRING,
	sortableVariants,
} from "./sortable.variants";

/** The resting geometry of a column of rows, the way the root derives it on the UI thread. */
function column(heights: number[], gap = 0) {
	const order = heights.map((_, index) => `r${index}`);
	const byId = Object.fromEntries(order.map((id, index) => [id, heights[index] ?? 0]));
	return { order, byId, offsets: computeOffsets(order, byId, gap), heights };
}

describe("defaults", () => {
	test("activation is the handle, spelled the house way", () => {
		expect(SORTABLE_ACTIVATIONS).toEqual(["handle", "long-press"]);
		expect(SORTABLE_DEFAULT_ACTIVATION).toBe("handle");
	});

	test("the numbers the spec names", () => {
		expect(SORTABLE_DEFAULT_LONG_PRESS_DELAY).toBe(220);
		expect(SORTABLE_DEFAULT_AUTOSCROLL_THRESHOLD).toBe(72);
		expect(SORTABLE_DEFAULT_AUTOSCROLL_SPEED).toBe(8);
		expect(SORTABLE_LIFT_SCALE).toBe(1.02);
		expect(SORTABLE_LIFT_DURATION).toBe(150);
		expect(SORTABLE_DEFAULT_HAPTIC).toEqual({ lift: "medium", pass: "selection" });
	});

	test("the shift spring is critically damped — rows land without bouncing past their slot", () => {
		const { stiffness, damping, mass } = SORTABLE_SHIFT_SPRING;
		expect(damping).toBeCloseTo(2 * Math.sqrt(stiffness * mass), 5);
	});
});

describe("reorderItems", () => {
	const order = ["a", "b", "c", "d", "e"];

	test.each([
		[0, 2, ["b", "c", "a", "d", "e"]],
		[4, 0, ["e", "a", "b", "c", "d"]],
		[1, 3, ["a", "c", "d", "b", "e"]],
		[3, 1, ["a", "d", "b", "c", "e"]],
		[0, 4, ["b", "c", "d", "e", "a"]],
	])("moves %i to %i", (from, to, expected) => {
		expect(reorderItems(order, from, to)).toEqual(expected);
	});

	test("returns a new array and leaves the input alone", () => {
		const next = reorderItems(order, 0, 1);
		expect(next).not.toBe(order);
		expect(order).toEqual(["a", "b", "c", "d", "e"]);
	});

	test("a move to the same index is a copy", () => {
		const next = reorderItems(order, 2, 2);
		expect(next).toEqual(order);
		expect(next).not.toBe(order);
	});

	test("an index out of range is a copy, not a hole", () => {
		expect(reorderItems(order, -1, 2)).toEqual(order);
		expect(reorderItems(order, 1, 9)).toEqual(order);
		expect(reorderItems([], 0, 0)).toEqual([]);
	});

	test("a pinned row keeps its index while the others flow around it", () => {
		const pinned = [false, false, true, false, false];
		expect(reorderItems(order, 0, 3, pinned)).toEqual(["b", "d", "c", "a", "e"]);
		expect(reorderItems(order, 4, 0, pinned)).toEqual(["e", "a", "c", "b", "d"]);
		expect(reorderItems(order, 1, 4, pinned)).toEqual(["a", "d", "c", "e", "b"]);
	});

	test("two pinned rows both hold", () => {
		const pinned = [true, false, true, false, false];
		expect(reorderItems(order, 4, 1, pinned)).toEqual(["a", "e", "c", "b", "d"]);
	});

	test("moving a pinned row, or onto one, is a copy", () => {
		const pinned = [false, false, true, false, false];
		expect(reorderItems(order, 2, 0, pinned)).toEqual(order);
		expect(reorderItems(order, 0, 2, pinned)).toEqual(order);
	});
});

describe("computeOffsets", () => {
	test("cumulative tops, with the gap between rows and none before the first", () => {
		expect(column([40, 60, 50], 8).offsets).toEqual([0, 48, 116]);
	});

	test("no gap", () => {
		expect(column([44, 44, 44]).offsets).toEqual([0, 44, 88]);
	});

	test("an unmeasured row counts as zero, so the rows after it are not lost", () => {
		expect(computeOffsets(["a", "b", "c"], { a: 40, c: 30 }, 4)).toEqual([0, 44, 48]);
	});

	test("follows the order, not the map", () => {
		expect(computeOffsets(["b", "a"], { a: 10, b: 30 }, 0)).toEqual([0, 30]);
	});

	test("empty", () => {
		expect(computeOffsets([], {}, 8)).toEqual([]);
	});
});

describe("resolveTargetIndex", () => {
	const even = column([50, 50, 50, 50, 50]);
	const noPins = [false, false, false, false, false];

	function target(activeIndex: number, translation: number, geometry = even, pinned = noPins) {
		return resolveTargetIndex({
			activeIndex,
			activeTop: (geometry.offsets[activeIndex] ?? 0) + translation,
			activeHeight: geometry.heights[activeIndex] ?? 0,
			offsets: geometry.offsets,
			heights: geometry.heights,
			pinned,
		});
	}

	test.each([
		[0, 0, 0],
		[0, 24, 0],
		[0, 26, 1],
		[0, 74, 1],
		[0, 76, 2],
		[0, 1000, 4],
		[2, -24, 2],
		[2, -26, 1],
		[2, -76, 0],
		[2, -1000, 0],
		[4, 30, 4],
	])("row %i dragged %ipt lands at %i (the first midpoint it crosses)", (from, translation, expected) => {
		expect(target(from, translation)).toBe(expected);
	});

	test("exactly on a midpoint has not crossed it", () => {
		expect(target(0, 25)).toBe(0);
		expect(target(2, -25)).toBe(2);
	});

	describe("variable heights", () => {
		const mixed = column([40, 120, 40, 80], 8);

		test("a short row must clear the tall row's midpoint, not its top", () => {
			// Tall row r1 spans 48–168, midpoint 108. r0's bottom is 40 + translation.
			expect(target(0, 67, mixed)).toBe(0);
			expect(target(0, 69, mixed)).toBe(1);
		});

		test("a tall row moving up crosses a short row's midpoint quickly", () => {
			// r0 spans 0–40, midpoint 20. r1's top is 48 + translation.
			expect(target(1, -27, mixed)).toBe(1);
			expect(target(1, -29, mixed)).toBe(0);
		});

		test("a tall row moving down crosses with its bottom edge", () => {
			// r2 spans 176–216, midpoint 196. r1's bottom is 168 + translation.
			expect(target(1, 27, mixed)).toBe(1);
			expect(target(1, 29, mixed)).toBe(2);
		});
	});

	describe("pinned", () => {
		const pinned = [false, false, true, false, false];

		test("never lands on a pinned slot — it stays short of it", () => {
			expect(target(0, 76, even, pinned)).toBe(1);
			expect(target(0, 100, even, pinned)).toBe(1);
		});

		test("skips over a pinned slot once the next free midpoint is crossed", () => {
			expect(target(0, 126, even, pinned)).toBe(3);
		});

		test("the same going up", () => {
			expect(target(4, -76, even, pinned)).toBe(3);
			expect(target(4, -126, even, pinned)).toBe(1);
		});

		test("a run of pinned slots at the end holds the row where it is", () => {
			expect(target(0, 1000, even, [false, true, true, true, true])).toBe(0);
		});
	});

	test("a single row has nowhere to go", () => {
		const one = column([50]);
		expect(target(0, 500, one, [false])).toBe(0);
	});
});

describe("resolveShifts", () => {
	test("rows between the slots step by the active row's height plus the gap", () => {
		const geometry = column([50, 50, 50, 50], 8);
		const projected = reorderItems(geometry.order, 0, 2);
		expect(resolveShifts(geometry.order, projected, geometry.byId, 8)).toEqual({
			r0: 116,
			r1: -58,
			r2: -58,
			r3: 0,
		});
	});

	test("moving up shifts the passed rows down", () => {
		const geometry = column([50, 50, 50, 50], 0);
		const projected = reorderItems(geometry.order, 3, 1);
		expect(resolveShifts(geometry.order, projected, geometry.byId, 0)).toEqual({
			r0: 0,
			r1: 50,
			r2: 50,
			r3: -100,
		});
	});

	test("variable heights: the passed row moves by the active row's height, the active row by theirs", () => {
		const geometry = column([100, 40, 60], 4);
		const projected = reorderItems(geometry.order, 0, 1);
		expect(resolveShifts(geometry.order, projected, geometry.byId, 4)).toEqual({ r0: 44, r1: -104, r2: 0 });
	});

	test("a pinned row in a crossed span moves by the height difference, keeping its index", () => {
		const geometry = column([80, 40, 40, 40], 0);
		const projected = reorderItems(geometry.order, 0, 3, [false, false, true, false]);
		expect(projected).toEqual(["r1", "r3", "r2", "r0"]);
		expect(resolveShifts(geometry.order, projected, geometry.byId, 0)).toEqual({
			r0: 120,
			r1: -80,
			r2: -40,
			r3: -120,
		});
	});

	test("an unchanged order shifts nothing", () => {
		const geometry = column([30, 30]);
		expect(resolveShifts(geometry.order, geometry.order, geometry.byId, 0)).toEqual({ r0: 0, r1: 0 });
	});
});

describe("resolveAutoscrollStep", () => {
	const top = 100;
	const height = 600;
	const threshold = 72;
	const speed = 8;
	const step = (finger: number) => resolveAutoscrollStep(finger, top, height, threshold, speed);

	test.each([
		[400, 0],
		[top + threshold, 0],
		[top + height - threshold, 0],
		[top + threshold / 2, -4],
		[top, -8],
		[top - 50, -8],
		[top + height - threshold / 2, 4],
		[top + height, 8],
		[top + height + 50, 8],
	])("a finger at %ipt steps %i", (finger, expected) => {
		expect(step(finger)).toBeCloseTo(expected, 5);
	});

	test("tapers linearly inside the band", () => {
		expect(step(top + threshold * 0.25)).toBeCloseTo(-6, 5);
		expect(step(top + height - threshold * 0.75)).toBeCloseTo(2, 5);
	});

	test("no threshold, no speed or no viewport means no scroll", () => {
		expect(resolveAutoscrollStep(top, top, height, 0, speed)).toBe(0);
		expect(resolveAutoscrollStep(top, top, height, threshold, 0)).toBe(0);
		expect(resolveAutoscrollStep(top, top, 0, threshold, speed)).toBe(0);
	});

	test("a viewport shorter than two bands reads the nearer edge", () => {
		expect(resolveAutoscrollStep(110, 100, 100, 72, 8)).toBeLessThan(0);
		expect(resolveAutoscrollStep(190, 100, 100, 72, 8)).toBeGreaterThan(0);
		expect(resolveAutoscrollStep(150, 100, 100, 72, 8)).toBe(0);
	});
});

describe("clampAutoscrollStep", () => {
	test("never scrolls the list's top further down than the viewport's top", () => {
		expect(clampAutoscrollStep(-8, 95, 2000, 100, 700)).toBe(-5);
		expect(clampAutoscrollStep(-8, 100, 2000, 100, 700)).toBe(0);
		expect(clampAutoscrollStep(-8, 0, 2000, 100, 700)).toBe(-8);
	});

	test("never scrolls the list's bottom further up than the viewport's bottom", () => {
		expect(clampAutoscrollStep(8, 0, 703, 100, 700)).toBe(3);
		expect(clampAutoscrollStep(8, 0, 700, 100, 700)).toBe(0);
		expect(clampAutoscrollStep(8, 0, 2000, 100, 700)).toBe(8);
	});

	test("zero stays zero", () => {
		expect(clampAutoscrollStep(0, 0, 2000, 100, 700)).toBe(0);
	});
});

describe("resolveMoveAction", () => {
	const order = ["a", "b", "c", "d"];

	test("one step either way", () => {
		expect(resolveMoveAction(order, "b", "up")).toEqual({ kind: "move", from: 1, to: 0 });
		expect(resolveMoveAction(order, "b", "down")).toEqual({ kind: "move", from: 1, to: 2 });
	});

	test("blocked at the ends", () => {
		expect(resolveMoveAction(order, "a", "up")).toEqual({ kind: "blocked" });
		expect(resolveMoveAction(order, "d", "down")).toEqual({ kind: "blocked" });
	});

	test("an unknown id is blocked", () => {
		expect(resolveMoveAction(order, "z", "up")).toEqual({ kind: "blocked" });
	});

	test("skips a pinned neighbour", () => {
		const pinned = [false, true, false, false];
		expect(resolveMoveAction(order, "c", "up", pinned)).toEqual({ kind: "move", from: 2, to: 0 });
		expect(resolveMoveAction(order, "a", "down", pinned)).toEqual({ kind: "move", from: 0, to: 2 });
	});

	test("blocked when only pinned rows lie that way", () => {
		expect(resolveMoveAction(order, "b", "up", [true, false, false, false])).toEqual({ kind: "blocked" });
	});

	test("a pinned row cannot move", () => {
		expect(resolveMoveAction(order, "b", "down", [false, true, false, false])).toEqual({ kind: "blocked" });
	});
});

describe("resolveSortablePosition", () => {
	test("one-based, out of the count", () => {
		expect(resolveSortablePosition(1, 5)).toBe("Position 2 of 5");
		expect(resolveSortablePosition(0, 1)).toBe("Position 1 of 1");
	});
});

describe("resolveSortableHaptics", () => {
	test("undefined takes the defaults", () => {
		expect(resolveSortableHaptics(undefined)).toEqual({ lift: "medium", pass: "selection" });
	});

	test("false silences both", () => {
		expect(resolveSortableHaptics(false)).toEqual({ lift: false, pass: false });
	});

	test("an object is taken as given", () => {
		expect(resolveSortableHaptics({ lift: "heavy", pass: "light" })).toEqual({ lift: "heavy", pass: "light" });
	});
});

describe("sortableVariants", () => {
	test("has the five slots", () => {
		const slots = sortableVariants();
		for (const slot of ["root", "item", "itemActive", "handle", "handleIcon"] as const) {
			expect(typeof slots[slot]()).toBe("string");
		}
	});

	test("the lifted row is opaque, so the rows it passes never show through", () => {
		expect(sortableVariants().itemActive()).toContain("bg-card");
	});

	test("the handle's touch target is at least 44pt", () => {
		const handle = sortableVariants().handle();
		const edge = Number(handle.match(/(?:^|\s)size-(\d+)(?:\s|$)/)?.[1]) * 4;
		expect(edge).toBeGreaterThanOrEqual(44);
	});

	test("disabled fades the handle", () => {
		expect(sortableVariants({ isDisabled: true }).handle()).toContain("opacity-50");
		expect(sortableVariants().handle()).not.toContain("opacity-50");
	});

	test("caller classNames merge last", () => {
		expect(sortableVariants().item({ className: "px-4" })).toContain("px-4");
	});

	test("the handle glyph's colour token is one theme.css declares", () => {
		expect(THEME_CSS).toContain(`--${SORTABLE_HANDLE_ICON_TOKEN}:`);
	});
});
