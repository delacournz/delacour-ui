import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { declarationCount } from "../../styles/theme-tokens.test";
import {
	describeSplitViewChildren,
	isSnapRangeFeasible,
	resolveDragHeight,
	resolveInitialSnapIndex,
	resolveNextIndex,
	resolveSnapAccessibility,
	resolveSnapHeights,
	resolveSplitViewAction,
	rubberBand,
	SPLIT_VIEW_DEFAULT_SNAP_POINTS,
	SPLIT_VIEW_DEFAULT_VARIANT,
	SPLIT_VIEW_DRAG_AREA_HEIGHT,
	SPLIT_VIEW_VARIANTS,
	sortSnapPoints,
	splitViewVariants,
} from "./split-view.variants";

const SLOTS = ["root", "top", "bottom", "dragArea", "rule", "handle"] as const;

function classes(className: string): string[] {
	return className.split(/\s+/).filter(Boolean);
}

function everyClass(): string[] {
	const all: string[] = [];
	for (const variant of SPLIT_VIEW_VARIANTS) {
		for (const isActive of [false, true]) {
			for (const isDisabled of [false, true]) {
				const slots = splitViewVariants({ isActive, isDisabled, variant });
				for (const slot of SLOTS) all.push(...classes(slots[slot]()));
			}
		}
	}
	return all;
}

describe("the axes", () => {
	test("name two variants and default to panes", () => {
		expect([...SPLIT_VIEW_VARIANTS]).toEqual(["panes", "seam"]);
		expect(SPLIT_VIEW_DEFAULT_VARIANT).toBe("panes");
		expect(classes(splitViewVariants().top())).toContain("rounded-lg");
	});

	test("default to three stops, the middle one first", () => {
		expect([...SPLIT_VIEW_DEFAULT_SNAP_POINTS]).toEqual([0.35, 0.65, 1]);
	});
});

describe("splitViewVariants", () => {
	test("stack the root in a column in both variants", () => {
		for (const variant of SPLIT_VIEW_VARIANTS) {
			expect(classes(splitViewVariants({ variant }).root())).toContain("flex-col");
		}
	});

	test("give panes surfaces a rounded continuous card, with no shadow", () => {
		const slots = splitViewVariants({ variant: "panes" });
		for (const pane of [slots.top(), slots.bottom()]) {
			const names = classes(pane);
			for (const name of ["overflow-hidden", "rounded-lg", "border", "border-border", "bg-card", "border-continuous"]) {
				expect(names).toContain(name);
			}
			expect(names.filter((n) => n.startsWith("shadow"))).toEqual([]);
		}
	});

	test("leave seam panes flush, with no border or fill", () => {
		const slots = splitViewVariants({ variant: "seam" });
		for (const pane of [slots.top(), slots.bottom()]) {
			const names = classes(pane);
			expect(names).toContain("overflow-hidden");
			expect(names.filter((n) => n.startsWith("border") || n.startsWith("bg-") || n.startsWith("rounded"))).toEqual([]);
		}
	});

	test("make the drag row 44pt tall and full width in both variants", () => {
		expect(SPLIT_VIEW_DRAG_AREA_HEIGHT).toBe(44);
		for (const variant of SPLIT_VIEW_VARIANTS) {
			const names = classes(splitViewVariants({ variant }).dragArea());
			expect(names).toContain("h-11");
			expect(names).toContain("w-full");
			expect(names).toContain("items-center");
			expect(names).toContain("justify-center");
		}
	});

	test("draw a 1pt rule behind the grip in seam only", () => {
		expect(classes(splitViewVariants({ variant: "seam" }).rule())).toContain("bg-border");
		expect(classes(splitViewVariants({ variant: "seam" }).rule())).toContain("h-px");
		expect(splitViewVariants({ variant: "panes" }).rule()).toBe("hidden");
	});

	test("make the grip a muted capsule that darkens while held and fades when disabled", () => {
		const rest = classes(splitViewVariants().handle());
		for (const name of ["h-1", "w-10", "rounded-full", "bg-muted-foreground"]) expect(rest).toContain(name);
		const held = classes(splitViewVariants({ isActive: true }).handle());
		expect(held).toContain("bg-foreground");
		expect(held).not.toContain("bg-muted-foreground");
		expect(classes(splitViewVariants({ isDisabled: true }).handle())).toContain("opacity-50");
	});

	test("name no size step and no raw palette colour anywhere", () => {
		const all = everyClass();
		expect(all.filter((name) => name.startsWith("size-"))).toEqual([]);
		expect(all.filter((name) => name.startsWith("shadow"))).toEqual([]);
		expect(
			all.filter((name) =>
				/^(bg|border|text)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/.test(
					name
				)
			)
		).toEqual([]);
	});

	test("name only tokens both variants of the theme declare", () => {
		const tokens = new Set(
			everyClass()
				.map((name) => name.match(/^(?:bg|border)-([a-z-]+)$/)?.[1])
				.filter((token): token is string => token !== undefined && token !== "continuous")
		);
		expect([...tokens].sort()).toEqual(["border", "card", "foreground", "muted-foreground"]);
		for (const token of tokens) expect(declarationCount(token)).toBe(2);
	});
});

describe("sortSnapPoints", () => {
	test("sorts ascending", () => {
		expect(sortSnapPoints([1, 0.3, 0.6])).toEqual({ data: [0.3, 0.6, 1], success: true });
	});

	test("dedupes", () => {
		expect(sortSnapPoints([0.5, 0.5, 1])).toEqual({ data: [0.5, 1], success: true });
	});

	test("drops NaN, infinities and negatives", () => {
		expect(sortSnapPoints([Number.NaN, -0.2, 0.4, Number.POSITIVE_INFINITY, 0.8])).toEqual({
			data: [0.4, 0.8],
			success: true,
		});
	});

	test("refuses fewer than two stops, naming the minimum", () => {
		for (const points of [[], [0.5], [0.5, 0.5], [Number.NaN, 0.5]]) {
			const result = sortSnapPoints(points);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toContain("2");
		}
	});
});

describe("resolveSnapHeights", () => {
	const base = { dragAreaHeight: 44, extent: 800, minBottom: 0, minTop: 0 };

	test("turns fractions into points of the box less the drag row, rounded", () => {
		expect(resolveSnapHeights({ ...base, points: [0.3, 0.6, 1] })).toEqual([227, 454, 756]);
	});

	test("reads anything above 1 as points", () => {
		expect(resolveSnapHeights({ ...base, points: [200, 400] })).toEqual([200, 400]);
	});

	test("lifts stops to the top floor and caps them under the bottom floor", () => {
		expect(resolveSnapHeights({ ...base, minBottom: 100, minTop: 100, points: [0, 1] })).toEqual([100, 656]);
	});

	test("never lets fraction 1 crush the bottom pane", () => {
		expect(resolveSnapHeights({ ...base, minBottom: 100, points: [0.5, 1] })).toEqual([378, 656]);
	});

	test("caps points at the usable height", () => {
		expect(resolveSnapHeights({ ...base, points: [100, 2000] })).toEqual([100, 756]);
	});

	test("puts every stop at the middle when the floors cannot both fit", () => {
		expect(resolveSnapHeights({ ...base, minBottom: 400, minTop: 400, points: [0.3, 0.6, 1] })).toEqual([
			378, 378, 378,
		]);
	});

	test("keeps stops that collapse to one height, so indices never shift", () => {
		const heights = resolveSnapHeights({ ...base, minTop: 500, points: [0.1, 0.3, 1] });
		expect(heights).toEqual([500, 500, 756]);
	});

	test("orders mixed units by height", () => {
		expect(resolveSnapHeights({ ...base, points: [0.5, 1, 120] })).toEqual([120, 378, 756]);
	});

	test("is idempotent", () => {
		const once = resolveSnapHeights({ ...base, minBottom: 60, minTop: 40, points: [0.3, 0.6, 1] });
		expect(resolveSnapHeights({ ...base, minBottom: 60, minTop: 40, points: once })).toEqual(once);
	});

	test("resolves to zeros before the box is measured", () => {
		expect(resolveSnapHeights({ ...base, extent: 0, points: [0.3, 1] })).toEqual([0, 0]);
	});
});

describe("isSnapRangeFeasible", () => {
	test("is false only when the two floors overlap", () => {
		expect(isSnapRangeFeasible({ dragAreaHeight: 44, extent: 800, minBottom: 100, minTop: 100 })).toBe(true);
		expect(isSnapRangeFeasible({ dragAreaHeight: 44, extent: 800, minBottom: 400, minTop: 400 })).toBe(false);
		expect(isSnapRangeFeasible({ dragAreaHeight: 44, extent: 0, minBottom: 400, minTop: 400 })).toBe(true);
	});
});

describe("resolveInitialSnapIndex", () => {
	test("defaults to the middle stop", () => {
		expect(resolveInitialSnapIndex({ count: 3, defaultIndex: undefined })).toBe(1);
		expect(resolveInitialSnapIndex({ count: 4, defaultIndex: undefined })).toBe(2);
		expect(resolveInitialSnapIndex({ count: 2, defaultIndex: undefined })).toBe(1);
	});

	test("clamps an out-of-range index", () => {
		expect(resolveInitialSnapIndex({ count: 3, defaultIndex: 7 })).toBe(2);
		expect(resolveInitialSnapIndex({ count: 3, defaultIndex: -1 })).toBe(0);
		expect(resolveInitialSnapIndex({ count: 3, defaultIndex: 1.6 })).toBe(2);
		expect(resolveInitialSnapIndex({ count: 3, defaultIndex: Number.NaN })).toBe(0);
	});
});

describe("rubberBand", () => {
	test("is zero at rest", () => {
		expect(rubberBand(0, 800)).toBe(0);
	});

	test("always gives less than it is pulled", () => {
		for (const x of [1, 10, 100, 1000]) expect(rubberBand(x, 800)).toBeLessThan(x);
	});

	test("is strictly increasing and bounded under half the box", () => {
		let last = 0;
		for (const x of [1, 10, 100, 1000, 10_000]) {
			const next = rubberBand(x, 800);
			expect(next).toBeGreaterThan(last);
			last = next;
		}
		expect(rubberBand(1e6, 800)).toBeLessThan(400);
	});

	test("mirrors a negative overshoot and gives nothing in an unmeasured box", () => {
		expect(rubberBand(-100, 800)).toBeCloseTo(-rubberBand(100, 800), 9);
		expect(rubberBand(100, 0)).toBe(0);
	});
});

describe("resolveDragHeight", () => {
	const heights = [200, 400, 700];

	test("follows the finger between the extremes", () => {
		expect(resolveDragHeight({ extent: 800, heights, start: 400, translation: 50 })).toBe(450);
		expect(resolveDragHeight({ extent: 800, heights, start: 400, translation: -150 })).toBe(250);
	});

	test("rubber-bands past either end", () => {
		const below = resolveDragHeight({ extent: 800, heights, start: 200, translation: -100 });
		expect(below).toBeLessThan(200);
		expect(below).toBeGreaterThan(100);
		const above = resolveDragHeight({ extent: 800, heights, start: 700, translation: 100 });
		expect(above).toBeGreaterThan(700);
		expect(above).toBeLessThan(800);
	});

	test("never goes below zero", () => {
		expect(resolveDragHeight({ extent: 800, heights: [0, 400], start: 0, translation: -500 })).toBe(0);
	});
});

describe("resolveNextIndex", () => {
	test("steps without wrapping", () => {
		expect(resolveNextIndex({ count: 3, direction: 1, index: 1, wrap: false })).toBe(2);
		expect(resolveNextIndex({ count: 3, direction: 1, index: 2, wrap: false })).toBe(2);
		expect(resolveNextIndex({ count: 3, direction: -1, index: 0, wrap: false })).toBe(0);
	});

	test("wraps when asked", () => {
		expect(resolveNextIndex({ count: 3, direction: 1, index: 2, wrap: true })).toBe(0);
		expect(resolveNextIndex({ count: 3, direction: -1, index: 0, wrap: true })).toBe(2);
	});
});

describe("resolveSnapAccessibility", () => {
	test("reads position N of M with both directions open in the middle", () => {
		expect(resolveSnapAccessibility({ count: 3, index: 1 })).toEqual({
			canDecrement: true,
			canIncrement: true,
			max: 2,
			min: 0,
			now: 1,
			text: "Position 2 of 3",
		});
	});

	test("closes the direction at each end", () => {
		expect(resolveSnapAccessibility({ count: 3, index: 0 }).canDecrement).toBe(false);
		expect(resolveSnapAccessibility({ count: 3, index: 2 }).canIncrement).toBe(false);
	});
});

describe("resolveSplitViewAction", () => {
	test("maps increment, decrement and activate to a stop", () => {
		expect(resolveSplitViewAction({ count: 3, index: 1, name: "increment" })).toEqual({
			index: 2,
			kind: "snap",
			source: "adjust",
		});
		expect(resolveSplitViewAction({ count: 3, index: 1, name: "decrement" })).toEqual({
			index: 0,
			kind: "snap",
			source: "adjust",
		});
		expect(resolveSplitViewAction({ count: 3, index: 2, name: "activate" })).toEqual({
			index: 0,
			kind: "snap",
			source: "cycle",
		});
	});

	test("returns null for a no-op or an unknown action", () => {
		expect(resolveSplitViewAction({ count: 3, index: 2, name: "increment" })).toBeNull();
		expect(resolveSplitViewAction({ count: 3, index: 0, name: "decrement" })).toBeNull();
		expect(resolveSplitViewAction({ count: 3, index: 1, name: "magicTap" })).toBeNull();
	});
});

describe("describeSplitViewChildren", () => {
	test("accepts Top, DragArea, Bottom in order", () => {
		expect(describeSplitViewChildren(["top", "dragArea", "bottom"])).toBeNull();
	});

	test("names any other shape", () => {
		expect(describeSplitViewChildren(["top", "bottom"])).toContain("SplitView.Top");
		expect(describeSplitViewChildren(["bottom", "dragArea", "top"])).not.toBeNull();
		expect(describeSplitViewChildren(["top", "dragArea", "bottom", "other"])).not.toBeNull();
	});
});

describe("worklet declaration order", () => {
	// The worklets plugin captures a worklet's closure where the function is
	// DECLARED, so a worklet calling a helper further down the file captures
	// `undefined` and throws on a device while `bun test` passes.
	test("no worklet calls a function declared below it", () => {
		const source = readFileSync(join(import.meta.dirname, "split-view.variants.ts"), "utf-8");
		const declared = new Map<string, number>();
		for (const match of source.matchAll(/^(?:export )?function (\w+)/gm)) {
			declared.set(match[1] as string, match.index);
		}
		const late: string[] = [];
		for (const [name, at] of declared) {
			const body = source.slice(at, source.indexOf("\n}\n", at));
			if (!body.includes('"worklet";')) continue;
			for (const call of body.matchAll(/\b(\w+)\(/g)) {
				const callee = call[1] as string;
				const calleeAt = declared.get(callee);
				if (callee !== name && calleeAt !== undefined && calleeAt > at) late.push(`${name} → ${callee}`);
			}
		}
		expect([...new Set(late)]).toEqual([]);
	});
});
