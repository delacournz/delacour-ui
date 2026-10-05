import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { clamp } from "../splitter/splitter.math";

/** `panes` is two rounded surfaces with the drag row between; `seam` is flush panes joined by a hairline grip. */
export const SPLIT_VIEW_VARIANTS = ["panes", "seam"] as const;

export type SplitViewVariant = (typeof SPLIT_VIEW_VARIANTS)[number];

/** A stop for the top pane's height. `<= 1` is a fraction of the box; `> 1` is points. */
export type SplitViewSnapPoint = number;

export const SPLIT_VIEW_DEFAULT_VARIANT: SplitViewVariant = "panes";

/** A third, two thirds, everything — the middle one is where an uncontrolled view starts. */
export const SPLIT_VIEW_DEFAULT_SNAP_POINTS: readonly SplitViewSnapPoint[] = [0.35, 0.65, 1];

/**
 * The drag row's height, in points — `h-11`.
 *
 * The HIG minimum touch target, and part of layout: the row takes this much of
 * the box, so a stop of `1` is the box less this. Restated as a number because
 * the stop heights are computed from it; a test pins it to the class.
 */
export const SPLIT_VIEW_DRAG_AREA_HEIGHT = 44;

/** The spring a release settles on. Its initial velocity is the finger's. */
export const SPLIT_VIEW_SPRING = { damping: 28, mass: 0.9, stiffness: 260 } as const;

/**
 * How far a release is projected, per millisecond — UIScrollView's `fast` rate.
 *
 * `projectSnap`'s default, the `normal` rate, carries a 1000pt/s release half a
 * screen: right for a scroll view, wrong for a divider whose stops are a few
 * hundred points apart, where it turns every lazy release into a skip. At this
 * rate the same release travels about a hundred points, so a flick still skips
 * a stop and a drop does not.
 */
export const SPLIT_VIEW_DECELERATION_RATE = 0.99;

/** The fewest stops a split view can have — one stop is not a choice. */
const MIN_SNAP_POINTS = 2;

/** How hard the drag resists past either end: iOS's own coefficient. */
const RUBBER_BAND_COEFFICIENT = 0.55;

/**
 * The slots, one `tv()` for every part.
 *
 * The drag row is a row of the column, not an overlay: 44pt of layout between
 * the panes in both variants, so the touch target is never taken out of either
 * pane and the bottom pane's `flex-1` is always the box less the top and the row.
 */
export const splitViewVariants = tv({
	slots: {
		root: "flex-col",
		top: "overflow-hidden",
		bottom: "flex-1 overflow-hidden",
		dragArea: "h-11 w-full items-center justify-center",
		rule: "",
		handle: "h-1 w-10 rounded-full bg-muted-foreground",
	},
	variants: {
		variant: {
			panes: {
				top: "rounded-lg border border-border border-continuous bg-card",
				bottom: "rounded-lg border border-border border-continuous bg-card",
				rule: "hidden",
			},
			seam: {
				rule: "absolute left-0 h-px w-full bg-border",
			},
		},
		isActive: {
			true: { handle: "bg-foreground" },
			false: {},
		},
		isDisabled: {
			true: { handle: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		isActive: false,
		isDisabled: false,
		variant: SPLIT_VIEW_DEFAULT_VARIANT,
	},
});

export type SplitViewVariantProps = VariantProps<typeof splitViewVariants>;

/**
 * Either the value, or why there is none.
 *
 * The same shape as `@delacour/types`' `Result`, restated rather than imported:
 * that package is private to the monorepo, and this file is copied into a
 * consumer's repository by the CLI and shipped to npm, where it would not resolve.
 */
export type SplitViewResult<Success> = { success: true; data: Success } | { success: false; error: string };

/**
 * The caller's stops, cleaned: non-finite and negative values dropped, sorted
 * ascending, duplicates removed.
 *
 * An error, not a throw, for fewer than two — the root warns and falls back to
 * the defaults rather than red-boxing a screen over a prop.
 */
export function sortSnapPoints(points: readonly SplitViewSnapPoint[]): SplitViewResult<SplitViewSnapPoint[]> {
	const sorted = [...new Set(points.filter((point) => Number.isFinite(point) && point >= 0))].sort((a, b) => a - b);
	if (sorted.length < MIN_SNAP_POINTS) {
		return {
			error: `SplitView needs at least ${MIN_SNAP_POINTS} distinct, non-negative snapPoints; got ${sorted.length}.`,
			success: false,
		};
	}
	return { data: sorted, success: true };
}

export type SnapRangeOptions = {
	/** The root's height, points. `0` until measured. */
	extent: number;
	/** Floor for the top pane, points. */
	minTop: number;
	/** Floor for the bottom pane, points. */
	minBottom: number;
	/** The drag row's height, points. */
	dragAreaHeight: number;
};

/**
 * Whether both floors fit in the box at once. An unmeasured box is feasible —
 * there is nothing to clash with yet.
 */
export function isSnapRangeFeasible({ extent, minTop, minBottom, dragAreaHeight }: SnapRangeOptions): boolean {
	if (extent <= 0) return true;
	const usable = Math.max(extent - dragAreaHeight, 0);
	return Math.max(minTop, 0) + Math.max(minBottom, 0) <= usable;
}

/**
 * Every stop as a top-pane height in points, ascending.
 *
 * The usable height is the box less the drag row. A stop `<= 1` is a fraction
 * of it, rounded to a whole point; anything larger is points. Each is then held
 * between the top floor and the usable height less the bottom floor, so no stop
 * ever crushes either pane — fraction `1` with a bottom floor of 100 is 100
 * short of the box.
 *
 * Two stops that clamp to the same height are **both kept**: the index is the
 * public value, and dropping one would shift every index above it. When the
 * floors cannot both fit, every stop is the middle of the box — the 50/50 the
 * root falls back to, with a warning.
 *
 * Sorted on the way out, because mixed units only have an order once the box
 * is known: `[0.5, 1, 120]` is `120, half, all`.
 */
export function resolveSnapHeights({
	points,
	extent,
	minTop,
	minBottom,
	dragAreaHeight,
}: SnapRangeOptions & { points: readonly SplitViewSnapPoint[] }): number[] {
	if (extent <= 0) return points.map(() => 0);
	const usable = Math.max(extent - dragAreaHeight, 0);
	const floor = Math.max(minTop, 0);
	const ceiling = usable - Math.max(minBottom, 0);
	if (floor > ceiling) return points.map(() => usable / 2);
	return points
		.map((point) => clamp(point <= 1 ? Math.round(point * usable) : point, floor, ceiling))
		.sort((a, b) => a - b);
}

/** Where an uncontrolled view starts: the caller's index held in range, or the middle stop. */
export function resolveInitialSnapIndex({ count, defaultIndex }: { count: number; defaultIndex?: number }): number {
	if (count <= 0) return 0;
	if (defaultIndex === undefined) return Math.floor(count / 2);
	return clamp(Math.round(defaultIndex), 0, count - 1);
}

/**
 * How far the pane moves when pulled `overshoot` points past an end.
 *
 * iOS's rubber band: `(1 − 1 / (x · c / d + 1)) · d`, with `d` half the box.
 * Less than the pull at every distance, ever-increasing, and never reaching
 * half the box however hard the finger pulls. Symmetric about zero.
 */
export function rubberBand(overshoot: number, extent: number): number {
	"worklet";
	if (extent <= 0 || overshoot === 0) return 0;
	const limit = extent / 2;
	const magnitude = (1 - 1 / ((Math.abs(overshoot) * RUBBER_BAND_COEFFICIENT) / limit + 1)) * limit;
	return overshoot < 0 ? -magnitude : magnitude;
}

/**
 * The top pane's height mid-drag: the finger's travel from `start`, free
 * between the lowest and highest stop and rubber-banded past them. Never
 * negative, so a hard pull up cannot fold the pane inside out.
 */
export function resolveDragHeight({
	start,
	translation,
	heights,
	extent,
}: {
	start: number;
	translation: number;
	heights: readonly number[];
	extent: number;
}): number {
	"worklet";
	const lowest = heights[0] ?? 0;
	const highest = heights[heights.length - 1] ?? lowest;
	const raw = start + translation;
	if (raw < lowest) return Math.max(lowest + rubberBand(raw - lowest, extent), 0);
	if (raw > highest) return highest + rubberBand(raw - highest, extent);
	return raw;
}

/** The stop one `direction` along from `index`; held at the ends, or wrapped round when `wrap` is set. */
export function resolveNextIndex({
	index,
	direction,
	count,
	wrap,
}: {
	index: number;
	direction: 1 | -1;
	count: number;
	wrap: boolean;
}): number {
	if (count <= 0) return 0;
	const next = index + direction;
	if (wrap) return ((next % count) + count) % count;
	return clamp(next, 0, count - 1);
}

export type SnapAccessibility = {
	min: number;
	max: number;
	now: number;
	text: string;
	canIncrement: boolean;
	canDecrement: boolean;
};

/** The drag row's adjustable value, and which directions are worth offering. */
export function resolveSnapAccessibility({ index, count }: { index: number; count: number }): SnapAccessibility {
	return {
		canDecrement: index > 0,
		canIncrement: index < count - 1,
		max: Math.max(count - 1, 0),
		min: 0,
		now: index,
		text: formatSnapPosition(index, count),
	};
}

/** `"Position 2 of 3"` — what VoiceOver reads for the drag row and what an announcement says. */
export function formatSnapPosition(index: number, count: number): string {
	return `Position ${index + 1} of ${count}`;
}

/**
 * What an assistive action on the drag row does.
 *
 * `adjust` is VoiceOver's swipe up and down — the screen reader reads the new
 * value itself. `cycle` is an activate (a double tap with VoiceOver on), which
 * it does not, so the root announces that one.
 */
export type SplitViewAction = { kind: "snap"; index: number; source: "adjust" | "cycle" };

/** An accessibility action name resolved to a stop, or `null` when it would move nothing. */
export function resolveSplitViewAction({
	name,
	index,
	count,
}: {
	name: string;
	index: number;
	count: number;
}): SplitViewAction | null {
	if (name === "activate") {
		return { index: resolveNextIndex({ count, direction: 1, index, wrap: true }), kind: "snap", source: "cycle" };
	}
	if (name !== "increment" && name !== "decrement") return null;
	const next = resolveNextIndex({ count, direction: name === "increment" ? 1 : -1, index, wrap: false });
	return next === index ? null : { index: next, kind: "snap", source: "adjust" };
}

/** What each child of the root turned out to be. */
export type SplitViewChildKind = "top" | "dragArea" | "bottom" | "other";

/** Why the children are not `Top`, `DragArea`, `Bottom` in that order — or `null` when they are. */
export function describeSplitViewChildren(kinds: readonly SplitViewChildKind[]): string | null {
	if (kinds.length === 3 && kinds[0] === "top" && kinds[1] === "dragArea" && kinds[2] === "bottom") return null;
	return `SplitView: children must be exactly SplitView.Top, SplitView.DragArea and SplitView.Bottom, in that order; got [${kinds.join(", ")}].`;
}
