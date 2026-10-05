import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { clamp, snapToStep } from "./splitter.math";

/** `horizontal` lays panes side by side; `vertical` stacks them. */
export const SPLITTER_ORIENTATIONS = ["horizontal", "vertical"] as const;

/** `seam` is a hairline between flush panes; `panes` gives each pane its own card surface. */
export const SPLITTER_VARIANTS = ["seam", "panes"] as const;

export type SplitterOrientation = (typeof SPLITTER_ORIENTATIONS)[number];
export type SplitterVariant = (typeof SPLITTER_VARIANTS)[number];

/** Percent of the box, 0..100. One number per pane, summing to 100. */
export type SplitterLayout = number[];

export const SPLITTER_DEFAULT_ORIENTATION: SplitterOrientation = "horizontal";
export const SPLITTER_DEFAULT_VARIANT: SplitterVariant = "seam";

/** What one assistive increment moves a seam by, and what a release rounds to. Percent. */
export const SPLITTER_DEFAULT_STEP = 5;

/**
 * The handle's touch box across the seam, in points — `w-11` / `h-11`.
 *
 * Restated as a number because the handle is positioned in points, centred on
 * the seam, and half of this is the offset. A test pins it to the class.
 */
export const SPLITTER_HANDLE_SIZE = 44;

/**
 * The space between surfaces in the `panes` variant, in points — `gap-2`.
 *
 * Restated for the same reason as {@link SPLITTER_HANDLE_SIZE}: the handle sits in
 * the middle of this gap, and finding the middle needs the number.
 */
export const SPLITTER_PANES_GAP = 8;

/** How far a held grip grows across the seam. Along the seam it stays put. */
export const SPLITTER_GRIP_ACTIVE_SCALE = 1.25;

/** The spring a held grip grows on — `Pressable`'s own, so a touch reads the same everywhere. */
export const SPLITTER_GRIP_SPRING = { damping: 18, mass: 0.4, stiffness: 320 } as const;

/**
 * The spring a programmatic change settles on — a reset, a collapse, an
 * assistive step. Clamped, because an overshoot would push a pane past the floor
 * it is meant to stop at.
 */
export const SPLITTER_SETTLE_SPRING = { damping: 26, mass: 1, overshootClamping: true, stiffness: 260 } as const;

/** Whether a variant draws the 1pt rule over the seam. `panes` has a gap instead. */
export const SPLITTER_DRAWS_LINE: Record<SplitterVariant, boolean> = { panes: false, seam: true };

/** Below this, two sizes are the same size. Well under anything a screen can draw. */
const EPSILON = 1e-6;

/** How far a caller's layout may miss 100 and still be read as theirs — rounding, not intent. */
const LAYOUT_SUM_TOLERANCE = 0.01;

/**
 * The slots, one `tv()` for every part.
 *
 * The handle is a 44pt touch box laid **over** the seam rather than a row of its
 * own, so it takes no room from the panes and a layout of `[30, 70]` is exactly
 * that. `z-10` is load-bearing: the trailing pane is a later sibling, draws over
 * the handle and would take every touch on its half.
 */
export const splitterVariants = tv({
	slots: {
		root: "",
		pane: "overflow-hidden",
		handle: "absolute z-10 items-center justify-center",
		line: "absolute bg-border",
		grip: "rounded-full bg-muted-foreground",
	},
	variants: {
		orientation: {
			horizontal: {
				root: "flex-row",
				handle: "top-0 h-full w-11",
				line: "h-full w-px",
				grip: "h-8 w-1",
			},
			vertical: {
				root: "flex-col",
				handle: "left-0 h-11 w-full",
				line: "h-px w-full",
				grip: "h-1 w-8",
			},
		},
		variant: {
			seam: {},
			panes: {
				root: "gap-2",
				pane: "rounded-lg border border-border border-continuous bg-card",
			},
		},
		isActive: {
			true: { grip: "bg-foreground" },
			false: {},
		},
		isDisabled: {
			true: { grip: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		isActive: false,
		isDisabled: false,
		orientation: SPLITTER_DEFAULT_ORIENTATION,
		variant: SPLITTER_DEFAULT_VARIANT,
	},
});

export type SplitterVariantProps = VariantProps<typeof splitterVariants>;

/** One pane's limits, read straight off its `Splitter.Pane` props. Percent throughout. */
export type SplitterPaneConstraints = {
	defaultSize?: number;
	minSize?: number;
	maxSize?: number;
	isCollapsible?: boolean;
	collapsedSize?: number;
};

type PaneBounds = { min: number; max: number; isCollapsible: boolean; collapsed: number };

function boundsOf(constraints: SplitterPaneConstraints | undefined): PaneBounds {
	"worklet";
	const min = clamp(constraints?.minSize ?? 0, 0, 100);
	return {
		collapsed: clamp(constraints?.collapsedSize ?? 0, 0, min),
		isCollapsible: constraints?.isCollapsible === true,
		max: clamp(constraints?.maxSize ?? 100, min, 100),
		min,
	};
}

function sumOf(layout: readonly number[], from = 0, to = layout.length): number {
	"worklet";
	let total = 0;
	for (let index = from; index < to; index++) total += layout[index] as number;
	return total;
}

/** A step between 0 (exclusive) and 50, or the default. A step past half the box could never land. */
export function resolveSplitterStep(step: number | undefined): number {
	"worklet";
	return step !== undefined && Number.isFinite(step) && step > 0 && step <= 50 ? step : SPLITTER_DEFAULT_STEP;
}

/** `count` equal shares of 100. */
export function equalLayout(count: number): SplitterLayout {
	"worklet";
	const layout: SplitterLayout = [];
	for (let index = 0; index < count; index++) layout.push(100 / count);
	return layout;
}

/** One finite, non-negative share per pane, summing to 100 within rounding. */
export function isLayoutValid(layout: readonly number[], count: number): boolean {
	"worklet";
	if (layout.length !== count) return false;
	for (const size of layout) {
		if (!Number.isFinite(size) || size < 0) return false;
	}
	return Math.abs(sumOf(layout) - 100) <= LAYOUT_SUM_TOLERANCE;
}

function isFeasible(bounds: readonly PaneBounds[]): boolean {
	"worklet";
	let floors = 0;
	let ceilings = 0;
	for (const pane of bounds) {
		floors += pane.isCollapsible ? pane.collapsed : pane.min;
		ceilings += pane.max;
	}
	return floors <= 100 + EPSILON && ceilings >= 100 - EPSILON;
}

/**
 * Pulls a layout inside every pane's bounds and back to a sum of 100.
 *
 * Each pane is clamped to its own floor and ceiling first — or held at its
 * collapsed size, when it is collapsible and already below half its floor — and
 * whatever that leaves over is shared among the panes with room, a few passes at
 * most. A layout that cannot be made to fit at all, or one of the wrong length,
 * becomes equal shares.
 */
export function fitLayout(layout: readonly number[], constraints: readonly SplitterPaneConstraints[]): SplitterLayout {
	"worklet";
	const count = constraints.length;
	const bounds = constraints.map(boundsOf);
	if (layout.length !== count || !isFeasible(bounds)) return equalLayout(count);

	const fixed: boolean[] = [];
	const next: SplitterLayout = [];
	for (let index = 0; index < count; index++) {
		const size = layout[index] as number;
		const pane = bounds[index] as PaneBounds;
		if (!Number.isFinite(size)) return equalLayout(count);
		const isCollapsed = pane.isCollapsible && (size <= pane.collapsed + EPSILON || size < pane.min / 2);
		fixed.push(isCollapsed);
		next.push(isCollapsed ? pane.collapsed : clamp(size, pane.min, pane.max));
	}

	for (let pass = 0; pass < count; pass++) {
		const remainder = 100 - sumOf(next);
		if (Math.abs(remainder) < EPSILON) break;
		const open: number[] = [];
		for (let index = 0; index < count; index++) {
			const pane = bounds[index] as PaneBounds;
			const size = next[index] as number;
			const hasRoom = remainder > 0 ? size < pane.max - EPSILON : size > pane.min + EPSILON;
			if (!fixed[index] && hasRoom) open.push(index);
		}
		if (open.length === 0) break;
		const share = remainder / open.length;
		for (const index of open) {
			const pane = bounds[index] as PaneBounds;
			next[index] = clamp((next[index] as number) + share, pane.min, pane.max);
		}
	}

	const leftover = 100 - sumOf(next);
	if (Math.abs(leftover) >= EPSILON && count > 0) next[count - 1] = (next[count - 1] as number) + leftover;
	return next;
}

/**
 * The layout a splitter starts from.
 *
 * A valid `layout` from the caller wins, fitted to the bounds. Otherwise each
 * pane's `defaultSize` is honoured and the panes that name none share what is
 * left equally. Anything that cannot be honoured — an invalid layout, defaults
 * that overflow the box or leave it short, floors that cannot all fit — falls
 * back to equal shares, which the root warns about in development.
 */
export function resolveInitialLayout(
	constraints: readonly SplitterPaneConstraints[],
	layout?: readonly number[]
): SplitterLayout {
	"worklet";
	const count = constraints.length;
	if (count === 0) return [];
	if (layout !== undefined) {
		return isLayoutValid(layout, count) ? fitLayout(layout, constraints) : equalLayout(count);
	}

	let named = 0;
	let unnamed = 0;
	for (const pane of constraints) {
		const size = pane.defaultSize;
		if (size === undefined) {
			unnamed++;
		} else if (!Number.isFinite(size) || size < 0) {
			return equalLayout(count);
		} else {
			named += size;
		}
	}
	if (named > 100 + EPSILON) return equalLayout(count);
	if (unnamed === 0 && Math.abs(named - 100) > LAYOUT_SUM_TOLERANCE) return equalLayout(count);
	if (!isFeasible(constraints.map(boundsOf))) return equalLayout(count);

	const share = unnamed === 0 ? 0 : (100 - named) / unnamed;
	return fitLayout(
		constraints.map((pane) => pane.defaultSize ?? share),
		constraints
	);
}

export type ResolveDragOptions = {
	/** The layout when the drag began — never the live one, so the drag cannot drift. */
	start: readonly number[];
	/** The seam between pane `handleIndex` and pane `handleIndex + 1`. */
	handleIndex: number;
	/** How far the seam has moved since `start`, in percent. Positive grows the leading pane. */
	delta: number;
	constraints: readonly SplitterPaneConstraints[];
};

/**
 * Moves one seam, touching only the two panes either side of it.
 *
 * The leading pane takes `start + delta`, held between its own floor and
 * ceiling and its neighbour's — whichever bites first — and the neighbour takes
 * the rest of their combined share, so the sum never moves. A collapsible pane
 * dragged below its floor stops there until the drag passes **half** of it, and
 * then snaps to its collapsed size; dragging back over that half reopens it at
 * its floor. That halfway line is the whole of the collapse gesture: no extra
 * mode, and the floor still feels like a floor.
 *
 * No movement returns `start` as it is, even a `start` outside the bounds.
 */
export function resolveDrag({ start, handleIndex, delta, constraints }: ResolveDragOptions): SplitterLayout {
	"worklet";
	const next = [...start];
	const leading = handleIndex;
	const trailing = handleIndex + 1;
	if (!Number.isFinite(delta) || delta === 0 || leading < 0 || trailing >= start.length) return next;

	const a = boundsOf(constraints[leading]);
	const b = boundsOf(constraints[trailing]);
	const total = (start[leading] as number) + (start[trailing] as number);
	const low = Math.max(a.min, total - b.max);
	const high = Math.min(a.max, total - b.min);
	if (low > high + EPSILON) return next;

	const raw = (start[leading] as number) + delta;
	let size = clamp(raw, low, high);

	if (a.isCollapsible && raw < a.min && raw < a.min / 2 && total - a.collapsed <= b.max + EPSILON) {
		size = a.collapsed;
	} else if (
		b.isCollapsible &&
		total - raw < b.min &&
		total - raw < b.min / 2 &&
		total - b.collapsed <= a.max + EPSILON
	) {
		size = total - b.collapsed;
	}

	next[leading] = size;
	next[trailing] = total - size;
	return next;
}

/** Whether a constraint stopped the seam short of where the finger is — the moment the edge haptic fires. */
export function isSeamHeld({
	start,
	handleIndex,
	delta,
	layout,
}: {
	start: readonly number[];
	handleIndex: number;
	delta: number;
	layout: readonly number[];
}): boolean {
	"worklet";
	const wanted = (start[handleIndex] ?? 0) + delta;
	return Math.abs((layout[handleIndex] ?? 0) - wanted) > EPSILON;
}

/**
 * Where a drag settles on release: the live result, with its **seam** rounded to `step`.
 *
 * The seam rather than the pane, so the second handle of three lands on the
 * grid as well — rounding pane widths would leave every later seam on an odd
 * number. The rounded seam is run back through {@link resolveDrag}, so a floor
 * that sits off the grid still holds, and a collapsed pane stays collapsed.
 */
export function resolveDragEnd({
	step,
	...options
}: ResolveDragOptions & {
	step: number;
}): SplitterLayout {
	"worklet";
	const live = resolveDrag(options);
	const { start, handleIndex } = options;
	if (handleIndex < 0 || handleIndex + 1 >= start.length) return live;
	const before = sumOf(start, 0, handleIndex);
	const seam = snapToStep(before + (live[handleIndex] as number), step);
	return resolveDrag({ ...options, delta: seam - before - (start[handleIndex] as number) });
}

/**
 * One assistive increment: the seam moves `step` and lands on the step grid.
 *
 * Returns `layout` itself — the same array — when a bound stops it, so a caller
 * can tell "nothing happened" by identity and skip the commit.
 */
export function resolveKeyboardStep({
	layout,
	handleIndex,
	direction,
	step,
	constraints,
}: {
	layout: SplitterLayout;
	handleIndex: number;
	direction: 1 | -1;
	step: number;
	constraints: readonly SplitterPaneConstraints[];
}): SplitterLayout {
	"worklet";
	const before = sumOf(layout, 0, handleIndex);
	const seam = before + (layout[handleIndex] ?? 0);
	const target = snapToStep(seam + direction * step, step);
	const next = resolveDrag({ constraints, delta: target - seam, handleIndex, start: layout });
	return layoutsEqual(next, layout) ? layout : next;
}

/** A collapsible pane sitting at its collapsed size. */
export function isPaneCollapsed(
	layout: readonly number[],
	index: number,
	constraints: readonly SplitterPaneConstraints[]
): boolean {
	"worklet";
	const pane = boundsOf(constraints[index]);
	return pane.isCollapsible && Math.abs((layout[index] ?? Number.NaN) - pane.collapsed) < EPSILON;
}

/** The collapsible pane beside a handle — the leading one first — or `-1`. */
export function adjacentCollapsibleIndex(handleIndex: number, constraints: readonly SplitterPaneConstraints[]): number {
	"worklet";
	if (constraints[handleIndex]?.isCollapsible) return handleIndex;
	if (constraints[handleIndex + 1]?.isCollapsible) return handleIndex + 1;
	return -1;
}

/**
 * Collapses pane `index`, or restores it.
 *
 * A collapse goes straight to the collapsed size — it does not run the drag's
 * halfway rule, which would refuse a collapsed size above half the floor. A
 * restore goes to the pane's `defaultSize`, then its floor, then an equal share
 * when it names neither. The trailing neighbour absorbs the difference, or the
 * leading one for the last pane; when neither can without breaking its own
 * bounds, nothing moves.
 *
 * Returns `layout` itself when nothing moves — a pane that cannot collapse, or
 * one no neighbour can absorb.
 */
export function resolveCollapseToggle({
	layout,
	index,
	constraints,
}: {
	layout: SplitterLayout;
	index: number;
	constraints: readonly SplitterPaneConstraints[];
}): SplitterLayout {
	"worklet";
	const pane = boundsOf(constraints[index]);
	const current = layout[index];
	if (!pane.isCollapsible || current === undefined) return layout;

	const restored = constraints[index]?.defaultSize ?? (pane.min > 0 ? pane.min : 100 / layout.length);
	const target = isPaneCollapsed(layout, index, constraints) ? clamp(restored, pane.min, pane.max) : pane.collapsed;
	const difference = current - target;

	for (const neighbour of [index + 1, index - 1]) {
		const size = layout[neighbour];
		if (size === undefined) continue;
		const bounds = boundsOf(constraints[neighbour]);
		const absorbed = size + difference;
		if (absorbed < bounds.min - EPSILON || absorbed > bounds.max + EPSILON) continue;
		const next = [...layout];
		next[index] = target;
		next[neighbour] = absorbed;
		return next;
	}
	return layout;
}

/**
 * Where seam `index` sits along the box, in points from its leading edge.
 *
 * Panes divide what is left after the gaps, so the seam is its share of that
 * plus every gap before it plus half its own — the middle of the space between
 * two surfaces, or the shared edge itself when there is no gap. `0` until the box
 * has been measured.
 */
export function seamOffset({
	sizes,
	index,
	extent,
	gap,
}: {
	sizes: readonly number[];
	index: number;
	extent: number;
	gap: number;
}): number {
	"worklet";
	if (!(extent > 0)) return 0;
	const available = Math.max(0, extent - gap * (sizes.length - 1));
	return (sumOf(sizes, 0, index + 1) / 100) * available + index * gap + gap / 2;
}

/** `from` → `to` at `t`. Jumps straight to `to` when the pane count changed under it. */
export function lerpLayout(from: readonly number[], to: readonly number[], t: number): SplitterLayout {
	"worklet";
	if (from.length !== to.length) return [...to];
	return to.map((size, index) => (from[index] as number) + (size - (from[index] as number)) * t);
}

/** Element-wise equality, to a hair. */
export function layoutsEqual(a: readonly number[], b: readonly number[]): boolean {
	"worklet";
	if (a.length !== b.length) return false;
	for (let index = 0; index < a.length; index++) {
		if (Math.abs((a[index] as number) - (b[index] as number)) >= EPSILON) return false;
	}
	return true;
}

/** What a screen reader reads as a handle's value: the leading pane, in whole percent. */
export function formatSplitterValue(percent: number): string {
	return `${Math.round(percent)} percent`;
}

/** What one child of a `<Splitter>` is. */
export type SplitterChildKind = "pane" | "handle" | "other";

/**
 * What is wrong with a splitter's children, or `null` when nothing is.
 *
 * The rule is panes alternating with handles, a pane at each end and at least
 * two of them. The root warns with this in development and renders anyway — a
 * wrong tree is a mistake to point at, not a reason to blank the screen.
 */
export function describeSplitterChildren(kinds: readonly SplitterChildKind[]): string | null {
	if (kinds.includes("other")) {
		return "Splitter: every child must be a Splitter.Pane or a Splitter.Handle.";
	}
	if (kinds[0] !== "pane") return "Splitter: must start with a Splitter.Pane.";
	if (kinds[kinds.length - 1] !== "pane") return "Splitter: must end with a Splitter.Pane.";
	if (kinds.filter((kind) => kind === "pane").length < 2) {
		return "Splitter: needs at least two Splitter.Pane children.";
	}
	for (let index = 0; index < kinds.length; index++) {
		if (kinds[index] !== (index % 2 === 0 ? "pane" : "handle")) {
			return "Splitter: panes and handles must alternate — one Splitter.Handle between every two panes.";
		}
	}
	return null;
}
