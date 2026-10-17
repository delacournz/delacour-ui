import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { HapticFeedback } from "../pressable/pressable";

/**
 * What lifts a row. `handle` puts the drag on `Sortable.Handle` alone, so the rest of the row
 * stays free for taps and scrolls; `long-press` lets the whole row lift after a hold.
 */
export const SORTABLE_ACTIVATIONS = ["handle", "long-press"] as const;

export type SortableActivation = (typeof SORTABLE_ACTIVATIONS)[number];

export const SORTABLE_DEFAULT_ACTIVATION: SortableActivation = "handle";

/** How long a row must be held before it lifts in `long-press` mode, in milliseconds. */
export const SORTABLE_DEFAULT_LONG_PRESS_DELAY = 220;

/** How close to the scroller's edge the finger has to be before it scrolls, in points. */
export const SORTABLE_DEFAULT_AUTOSCROLL_THRESHOLD = 72;

/** Points per frame the scroller moves with the finger right at its edge. */
export const SORTABLE_DEFAULT_AUTOSCROLL_SPEED = 8;

/** How far the lifted row grows. Enough to read as raised, not enough to cover its neighbours. */
export const SORTABLE_LIFT_SCALE = 1.02;

/** How long the lift and the drop of the scale take, in milliseconds. */
export const SORTABLE_LIFT_DURATION = 150;

/**
 * The spring the resting rows shift on, and the dropped row lands on.
 *
 * Critically damped — `damping = 2√(stiffness·mass)` — so a row arrives at its slot without
 * overshooting into the one beyond, which on a tight list would briefly overlap a neighbour.
 * A test holds the relation, so retuning one number cannot quietly make it bounce.
 */
export const SORTABLE_SHIFT_SPRING = { stiffness: 400, damping: 40, mass: 1 } as const;

/** The haptic pair a `Sortable` plays when the caller names none. */
export const SORTABLE_DEFAULT_HAPTIC = { lift: "medium", pass: "selection" } as const satisfies SortableHaptic;

/** The theme token the handle's grip is drawn in. */
export const SORTABLE_HANDLE_ICON_TOKEN = "muted-foreground";

/** A lift haptic and a pass haptic: one when the row comes up, one each time it changes slot. */
export type SortableHaptic = { lift: HapticFeedback; pass: HapticFeedback };

/** What a worklet reads: each haptic, or `false` for none. */
export type ResolvedSortableHaptics = { lift: HapticFeedback | false; pass: HapticFeedback | false };

/** Which way a screen-reader action moves a row. */
export type SortableMoveDirection = "up" | "down";

/** What a Move up / Move down action would do. */
export type SortableMoveAction = { kind: "move"; from: number; to: number } | { kind: "blocked" };

/**
 * Settles the `haptic` prop into the two values the gesture worklet reads.
 *
 * Destructured to primitives on the way out because Reanimated's plugin captures what a worklet
 * closes over — an object rebuilt each render would rebuild the gesture with it.
 */
export function resolveSortableHaptics(haptic: false | SortableHaptic | undefined): ResolvedSortableHaptics {
	if (haptic === false) return { lift: false, pass: false };
	const resolved = haptic ?? SORTABLE_DEFAULT_HAPTIC;
	return { lift: resolved.lift, pass: resolved.pass };
}

/**
 * Moves the entry at `from` to `to`, returning a new array.
 *
 * With `pinned`, a pinned entry keeps its index: the move happens among the free entries only,
 * which are then written back into the free indices in order. Moving a pinned entry, or onto a
 * pinned index, is a copy — that is a move the gesture and the actions never ask for, and a copy
 * is the answer that leaves the caller's list intact.
 *
 * An index out of range is also a copy rather than a splice that would leave a hole.
 */
export function reorderItems<T>(order: readonly T[], from: number, to: number, pinned?: readonly boolean[]): T[] {
	"worklet";
	const result = order.slice();
	const length = order.length;
	if (from < 0 || from >= length || to < 0 || to >= length || from === to) return result;
	if (pinned !== undefined && (pinned[from] === true || pinned[to] === true)) return result;

	const free: number[] = [];
	for (let index = 0; index < length; index++) {
		if (pinned === undefined || pinned[index] !== true) free.push(index);
	}
	const values: T[] = [];
	for (const index of free) values.push(order[index] as T);

	const fromFree = free.indexOf(from);
	const toFree = free.indexOf(to);
	const [moved] = values.splice(fromFree, 1);
	values.splice(toFree, 0, moved as T);

	for (let slot = 0; slot < free.length; slot++) {
		result[free[slot] as number] = values[slot] as T;
	}
	return result;
}

/**
 * The resting top of every row, in `order`, with `gap` between rows and none before the first.
 *
 * A row that has not reported a height yet counts as zero, so the rows after it keep their place
 * in the sum rather than all collapsing to `NaN`.
 */
export function computeOffsets(
	order: readonly string[],
	heights: Readonly<Record<string, number>>,
	gap: number
): number[] {
	"worklet";
	const offsets: number[] = [];
	let top = 0;
	for (let index = 0; index < order.length; index++) {
		offsets.push(top);
		top += (heights[order[index] as string] ?? 0) + gap;
	}
	return offsets;
}

/** The furthest slot below `activeIndex` whose midpoint `bottom` has passed, or `activeIndex`. */
function crossedBelow(
	activeIndex: number,
	bottom: number,
	offsets: readonly number[],
	heights: readonly number[]
): number {
	"worklet";
	let target = activeIndex;
	for (let index = activeIndex + 1; index < offsets.length; index++) {
		if (bottom <= (offsets[index] ?? 0) + (heights[index] ?? 0) / 2) break;
		target = index;
	}
	return target;
}

/** The furthest slot above `activeIndex` whose midpoint `top` has passed, or `activeIndex`. */
function crossedAbove(
	activeIndex: number,
	top: number,
	offsets: readonly number[],
	heights: readonly number[]
): number {
	"worklet";
	let target = activeIndex;
	for (let index = activeIndex - 1; index >= 0; index--) {
		if (top >= (offsets[index] ?? 0) + (heights[index] ?? 0) / 2) break;
		target = index;
	}
	return target;
}

/**
 * The slot the dragged row would drop into, from where it is now.
 *
 * **Midpoint crossing, not the nearest slot.** Moving down, the row takes the furthest slot whose
 * midpoint its bottom edge has passed; moving up, the furthest whose midpoint its top edge has
 * passed. The nearest-slot rule swaps a short row past a tall one only once it has travelled half
 * the tall one's height, which feels stuck; the crossing rule swaps as soon as the edge reaches the
 * neighbour's middle, at any pair of heights. Exactly on a midpoint has not crossed it.
 *
 * Every comparison is against the *resting* geometry, never the shifted one, so the answer for a
 * given finger position does not depend on how the rows around it happen to be animating.
 *
 * **Never a pinned slot.** A row whose crossing lands on a pinned slot stops short of it, and skips
 * over it once the next free midpoint is crossed.
 */
export function resolveTargetIndex({
	activeIndex,
	activeTop,
	activeHeight,
	offsets,
	heights,
	pinned,
}: {
	activeIndex: number;
	activeTop: number;
	activeHeight: number;
	offsets: readonly number[];
	heights: readonly number[];
	pinned: readonly boolean[];
}): number {
	"worklet";
	const below = crossedBelow(activeIndex, activeTop + activeHeight, offsets, heights);
	let target = below === activeIndex ? crossedAbove(activeIndex, activeTop, offsets, heights) : below;

	const step = target > activeIndex ? -1 : 1;
	while (target !== activeIndex && pinned[target] === true) target += step;
	return target;
}

/**
 * How far each row's top moves between `order` and `projected`, keyed by id.
 *
 * One rule for every case: lay both orders out from the same heights and subtract. A resting row
 * between the slots moves by the dragged row's height plus the gap; the dragged row moves by the
 * height of everything it passed; a pinned row inside the span keeps its index but moves by the
 * difference in what now sits above it. A simple `± (height + gap)` is right only for the first of
 * those three.
 */
export function resolveShifts(
	order: readonly string[],
	projected: readonly string[],
	heights: Readonly<Record<string, number>>,
	gap: number
): Record<string, number> {
	"worklet";
	const before: Record<string, number> = {};
	let top = 0;
	for (const id of order) {
		before[id] = top;
		top += (heights[id] ?? 0) + gap;
	}
	const shifts: Record<string, number> = {};
	top = 0;
	for (const id of projected) {
		shifts[id] = top - (before[id] ?? 0);
		top += (heights[id] ?? 0) + gap;
	}
	return shifts;
}

/**
 * How many points the scroller should move this frame, signed: negative scrolls up.
 *
 * Zero until the finger is inside `threshold` of the viewport's top or bottom edge, then tapered
 * linearly from nothing at the threshold to `speed` at the edge — and `speed` beyond it, since a
 * finger past the edge wants the fastest scroll there is. A viewport shorter than two bands reads
 * the nearer edge, and is still exactly between them.
 */
export function resolveAutoscrollStep(
	fingerY: number,
	viewportTop: number,
	viewportHeight: number,
	threshold: number,
	speed: number
): number {
	"worklet";
	if (threshold <= 0 || speed <= 0 || viewportHeight <= 0) return 0;
	const fromTop = Math.max(0, fingerY - viewportTop);
	const fromBottom = Math.max(0, viewportTop + viewportHeight - fingerY);
	if (fromTop < threshold && fromTop < fromBottom) return -speed * (1 - fromTop / threshold);
	if (fromBottom < threshold && fromBottom < fromTop) return speed * (1 - fromBottom / threshold);
	return 0;
}

/**
 * Trims an autoscroll step so it never scrolls past the list itself.
 *
 * Scrolling up stops once the list's top is in view; scrolling down once its bottom is. That is
 * also what keeps a `scrollTo` inside the scroller's content without knowing the content height:
 * the list sits inside the content, so a list edge brought into view is never past the content's.
 * Every argument is in the same (window) coordinates.
 */
export function clampAutoscrollStep(
	step: number,
	listTop: number,
	listBottom: number,
	viewportTop: number,
	viewportBottom: number
): number {
	"worklet";
	if (step < 0) {
		const remaining = viewportTop - listTop;
		return remaining <= 0 ? 0 : Math.max(step, -remaining);
	}
	if (step > 0) {
		const remaining = listBottom - viewportBottom;
		return remaining <= 0 ? 0 : Math.min(step, remaining);
	}
	return 0;
}

/**
 * What a screen reader's Move up or Move down does to the row `id`.
 *
 * One step, skipping pinned rows, since a pinned row's slot is never one another row lands in.
 * Blocked at either end, for an id that is not in the order, and for a pinned row itself — so the
 * row publishes only the actions it can perform.
 */
export function resolveMoveAction(
	order: readonly string[],
	id: string,
	direction: SortableMoveDirection,
	pinned?: readonly boolean[]
): SortableMoveAction {
	const from = order.indexOf(id);
	if (from === -1 || pinned?.[from] === true) return { kind: "blocked" };
	const step = direction === "up" ? -1 : 1;
	for (let to = from + step; to >= 0 && to < order.length; to += step) {
		if (pinned?.[to] !== true) return { kind: "move", from, to };
	}
	return { kind: "blocked" };
}

/** The row's place in the list, as a screen reader hears it. One-based. */
export function resolveSortablePosition(index: number, count: number): string {
	return `Position ${index + 1} of ${count}`;
}

/**
 * Styling for every part of a sortable list.
 *
 * - `item` is the wrapper every row sits in — the box that is measured and moved.
 * - `itemActive` is added while the row is lifted: raised above the rows it passes, and an opaque
 *   `bg-card` with a shadow, so the row underneath never shows through a transparent one. This is
 *   the one place the package casts a shadow: a dragged row floats over its siblings, and a fill
 *   step alone cannot say that when the sibling beneath is the same fill.
 * - `handle` is a 44pt square — the touch target — around a glyph at the icon scale.
 *
 * The handle is not a `Pressable`: it is a pan surface, the way `Slider.Track` is, so it owns its
 * own opacity and the disabled fade sits on it directly.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const sortableVariants = tv({
	slots: {
		root: "flex-col",
		item: "relative",
		itemActive: "z-10 rounded-lg bg-card shadow-md",
		handle: "size-11 items-center justify-center",
		handleIcon: "size-icon-md",
	},
	variants: {
		isDisabled: {
			true: { handle: "opacity-50" },
		},
	},
});

export type SortableVariantProps = VariantProps<typeof sortableVariants>;
