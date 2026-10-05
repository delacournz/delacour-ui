import { describe, expect, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	partitionSwipeChildren,
	resolveOutermostIndex,
	resolveSwipeActionForegroundToken,
	resolveSwipeDrag,
	resolveSwipeRelease,
	resolveTileLayout,
	SWIPE_ACTION_COLORS,
	SWIPE_END_DISPLAY_NAME,
	SWIPE_FULL_FRACTION,
	SWIPE_PROJECTION,
	SWIPE_RUBBER_BAND,
	SWIPE_START_DISPLAY_NAME,
	SWIPE_TILE_WIDTH,
	type SwipeTileProps,
	swipeVariants,
	toPhysicalOffset,
} from "./swipe.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** A plain object shaped like a React element — the partition reads nothing else. */
function element(displayName: string, children?: ReactNode, key?: string): ReactElement<SwipeTileProps> {
	return { key: key ?? null, props: { children }, type: { displayName } } as unknown as ReactElement<SwipeTileProps>;
}

const START = (children?: ReactNode) => element(SWIPE_START_DISPLAY_NAME, children);
const END = (children?: ReactNode) => element(SWIPE_END_DISPLAY_NAME, children);
const ACTION = (key: string) => element("DelacourUI.Swipe.Action", undefined, key);
const ROW = (key: string) => element("DelacourUI.Item", undefined, key);

describe("partitionSwipeChildren", () => {
	test("lifts each marker's children out by element type, and keeps the rest as the row", () => {
		const done = ACTION("done");
		const snooze = ACTION("snooze");
		const remove = ACTION("delete");
		const row = ROW("row");

		const parts = partitionSwipeChildren([START(done), END([snooze, remove]), row]);

		expect(parts.start).toEqual([done]);
		expect(parts.end).toEqual([snooze, remove]);
		expect(parts.row).toEqual([row]);
	});

	test("order does not matter", () => {
		const row = ROW("row");
		const remove = ACTION("delete");
		const parts = partitionSwipeChildren([row, END(remove)]);

		expect(parts.start).toEqual([]);
		expect(parts.end).toEqual([remove]);
		expect(parts.row).toEqual([row]);
	});

	test("flattens nested arrays, and drops holes inside a panel", () => {
		const a = ACTION("a");
		const b = ACTION("b");
		const parts = partitionSwipeChildren([[END([null, [a, false], undefined, b])]]);

		expect(parts.end).toEqual([a, b]);
	});

	test("keeps plain text and numbers in the row, and drops holes there too", () => {
		const parts = partitionSwipeChildren(["Label", 3, null, false, undefined]);
		expect(parts.row).toEqual(["Label", 3]);
	});

	test("two markers for one side concatenate in source order", () => {
		const a = ACTION("a");
		const b = ACTION("b");
		expect(partitionSwipeChildren([END(a), END(b)]).end).toEqual([a, b]);
	});

	test("a lone child that is not an array still partitions", () => {
		const row = ROW("row");
		expect(partitionSwipeChildren(row).row).toEqual([row]);
	});
});

describe("resolveOutermostIndex", () => {
	test("end: the last tile", () => {
		expect(resolveOutermostIndex("end", 3)).toBe(2);
		expect(resolveOutermostIndex("end", 1)).toBe(0);
	});

	test("start: the first tile", () => {
		expect(resolveOutermostIndex("start", 3)).toBe(0);
	});

	test("an empty side has no outermost tile", () => {
		expect(resolveOutermostIndex("end", 0)).toBe(-1);
		expect(resolveOutermostIndex("start", 0)).toBe(-1);
	});
});

describe("resolveSwipeDrag", () => {
	test("passes a drag through on a side with a panel", () => {
		expect(resolveSwipeDrag({ endWidth: 144, raw: -60, startWidth: 72 })).toBe(-60);
		expect(resolveSwipeDrag({ endWidth: 144, raw: 60, startWidth: 72 })).toBe(60);
	});

	test("rubber-bands a side with no panel", () => {
		expect(resolveSwipeDrag({ endWidth: 144, raw: 100, startWidth: 0 })).toBeCloseTo(100 * SWIPE_RUBBER_BAND);
		expect(resolveSwipeDrag({ endWidth: 0, raw: -100, startWidth: 72 })).toBeCloseTo(-100 * SWIPE_RUBBER_BAND);
	});

	test("the resistance is the spec's 0.2", () => {
		expect(SWIPE_RUBBER_BAND).toBe(0.2);
	});
});

describe("resolveSwipeRelease", () => {
	const base = { endWidth: 144, isFullSwipe: true, rowWidth: 400, startWidth: 72 };
	const fullAt = base.endWidth + SWIPE_FULL_FRACTION * base.rowWidth;

	test("a release short of half the panel closes", () => {
		expect(resolveSwipeRelease({ ...base, offset: -60, velocity: 0 })).toEqual({ kind: "close" });
		expect(resolveSwipeRelease({ ...base, offset: 30, velocity: 0 })).toEqual({ kind: "close" });
	});

	test("a release past half the panel opens that side", () => {
		expect(resolveSwipeRelease({ ...base, offset: -80, velocity: 0 })).toEqual({ kind: "open", side: "end" });
		expect(resolveSwipeRelease({ ...base, offset: 40, velocity: 0 })).toEqual({ kind: "open", side: "start" });
	});

	test("projects the release by velocity", () => {
		expect(SWIPE_PROJECTION).toBe(0.1);
		// -40 + -500 * 0.1 = -90, past half of 144.
		expect(resolveSwipeRelease({ ...base, offset: -40, velocity: -500 })).toEqual({ kind: "open", side: "end" });
		// -100 + 500 * 0.1 = -50, short of half.
		expect(resolveSwipeRelease({ ...base, offset: -100, velocity: 500 })).toEqual({ kind: "close" });
	});

	test("a flick across the rest position closes rather than opening the other side", () => {
		expect(resolveSwipeRelease({ ...base, offset: -20, velocity: 2000 })).toEqual({ kind: "close" });
	});

	test("a side with no panel never opens", () => {
		expect(resolveSwipeRelease({ ...base, offset: 50, startWidth: 0, velocity: 800 })).toEqual({ kind: "close" });
	});

	test("past the full-swipe point, a release fires the outermost action", () => {
		expect(resolveSwipeRelease({ ...base, offset: -(fullAt + 1), velocity: 0 })).toEqual({
			kind: "full",
			side: "end",
		});
		const startFullAt = base.startWidth + SWIPE_FULL_FRACTION * base.rowWidth;
		expect(resolveSwipeRelease({ ...base, offset: startFullAt + 1, velocity: 0 })).toEqual({
			kind: "full",
			side: "start",
		});
	});

	test("a flick alone never reaches a full swipe — the finger has to cross the point", () => {
		expect(resolveSwipeRelease({ ...base, offset: -(fullAt - 40), velocity: -3000 })).toEqual({
			kind: "open",
			side: "end",
		});
	});

	test("pulling back from past the point before letting go does not fire", () => {
		expect(resolveSwipeRelease({ ...base, offset: -(fullAt + 10), velocity: 1500 })).toEqual({
			kind: "open",
			side: "end",
		});
	});

	test("isFullSwipe false opens instead", () => {
		expect(resolveSwipeRelease({ ...base, isFullSwipe: false, offset: -(fullAt + 50), velocity: 0 })).toEqual({
			kind: "open",
			side: "end",
		});
	});

	test("an unmeasured row never full-swipes", () => {
		expect(resolveSwipeRelease({ ...base, offset: -400, rowWidth: 0, velocity: 0 })).toEqual({
			kind: "open",
			side: "end",
		});
	});
});

describe("resolveTileLayout", () => {
	const tileWidth = SWIPE_TILE_WIDTH;

	test("closed: every tile packs against the row edge", () => {
		for (const index of [0, 1, 2]) {
			expect(resolveTileLayout({ count: 3, index, offset: 0, side: "end", tileWidth })).toEqual({
				width: tileWidth,
				x: 0,
			});
		}
	});

	test("part open: tiles spread in proportion, innermost against the row", () => {
		const offset = -108;
		expect(resolveTileLayout({ count: 3, index: 0, offset, side: "end", tileWidth }).x).toBe(0);
		expect(resolveTileLayout({ count: 3, index: 1, offset, side: "end", tileWidth }).x).toBe(36);
		expect(resolveTileLayout({ count: 3, index: 2, offset, side: "end", tileWidth }).x).toBe(72);
	});

	test("fully open: tiles are whole and edge to edge", () => {
		const offset = -3 * tileWidth;
		for (const index of [0, 1, 2]) {
			expect(resolveTileLayout({ count: 3, index, offset, side: "end", tileWidth })).toEqual({
				width: tileWidth,
				x: index * tileWidth,
			});
		}
	});

	test("on start the order runs the other way: the first tile is outermost", () => {
		const offset = 2 * tileWidth;
		expect(resolveTileLayout({ count: 2, index: 1, offset, side: "start", tileWidth }).x).toBe(0);
		expect(resolveTileLayout({ count: 2, index: 0, offset, side: "start", tileWidth }).x).toBe(tileWidth);
	});

	test("overshoot: the outermost tile grows to fill it, the others hold", () => {
		const offset = -(2 * tileWidth + 50);
		expect(resolveTileLayout({ count: 2, index: 0, offset, side: "end", tileWidth })).toEqual({
			width: tileWidth,
			x: 0,
		});
		expect(resolveTileLayout({ count: 2, index: 1, offset, side: "end", tileWidth })).toEqual({
			width: tileWidth + 50,
			x: tileWidth,
		});
	});

	test("the tiles always cover the gap exactly — no hole, nothing past the panel", () => {
		for (const reveal of [0, 10, 72, 100, 144, 216, 300, 500]) {
			const count = 3;
			let reach = 0;
			for (let index = 0; index < count; index++) {
				const { x, width } = resolveTileLayout({ count, index, offset: -reveal, side: "end", tileWidth });
				reach = Math.max(reach, x + width);
			}
			expect(reach).toBeGreaterThanOrEqual(reveal);
			if (reveal >= count * tileWidth) expect(reach).toBe(reveal);
		}
	});

	test("the other side's offset reveals nothing here", () => {
		expect(resolveTileLayout({ count: 2, index: 1, offset: 120, side: "end", tileWidth })).toEqual({
			width: tileWidth,
			x: 0,
		});
	});
});

describe("toPhysicalOffset", () => {
	test("left to right, the logical offset is the translation", () => {
		expect(toPhysicalOffset(40, false)).toBe(40);
	});

	test("right to left mirrors it, so end stays the edge text runs toward", () => {
		expect(toPhysicalOffset(40, true)).toBe(-40);
		expect(toPhysicalOffset(-40, true)).toBe(40);
	});
});

describe("tile width", () => {
	test("is 72pt, and the content box class says the same", () => {
		expect(SWIPE_TILE_WIDTH).toBe(72);
		expect(swipeVariants().tileContent()).toContain("w-18");
	});
});

describe("swipeVariants", () => {
	test("default paints muted with foreground ink", () => {
		const slots = swipeVariants({ color: "default" });
		expect(slots.tile()).toContain("bg-muted");
		expect(slots.tileLabel()).toContain("text-foreground");
		expect(slots.panel()).toContain("bg-muted");
	});

	test("every other colour paints its own surface and its own foreground", () => {
		for (const color of SWIPE_ACTION_COLORS) {
			if (color === "default") continue;
			const slots = swipeVariants({ color });
			expect(slots.tile()).toContain(`bg-${color}`);
			expect(slots.panel()).toContain(`bg-${color}`);
			expect(slots.tileLabel()).toContain(`text-${color}-foreground`);
		}
	});

	test("label is text-xs and its colour sits on the label, never the tile", () => {
		for (const color of SWIPE_ACTION_COLORS) {
			const slots = swipeVariants({ color });
			expect(slots.tileLabel()).toContain("text-xs");
			expect(slots.tile()).not.toMatch(/\btext-/);
		}
	});

	test("the row takes no background of its own", () => {
		expect(swipeVariants().row()).not.toMatch(/\bbg-/);
	});

	test("the root clips, so a fly-off never paints outside the row", () => {
		expect(swipeVariants().root()).toContain("overflow-hidden");
		expect(swipeVariants().panel()).toContain("overflow-hidden");
	});

	test("a caller's className wins", () => {
		expect(swipeVariants().root({ className: "rounded-lg" })).toContain("rounded-lg");
	});
});

describe("tokens", () => {
	test("every surface and foreground named is declared in both themes", () => {
		for (const color of SWIPE_ACTION_COLORS) {
			const slots = swipeVariants({ color });
			const named = [
				...(slots.tile().match(/\bbg-([a-z-]+)/g) ?? []).map((cls) => cls.slice(3)),
				...(slots.tileLabel().match(/\btext-([a-z]+(?:-[a-z]+)*)/g) ?? [])
					.map((cls) => cls.slice(5))
					.filter((token) => token !== "xs" && token !== "center"),
				resolveSwipeActionForegroundToken(color),
			];
			for (const token of named) {
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});

	test("the glyph's tint token matches the label's foreground class", () => {
		for (const color of SWIPE_ACTION_COLORS) {
			expect(swipeVariants({ color }).tileLabel()).toContain(`text-${resolveSwipeActionForegroundToken(color)}`);
		}
	});
});
