import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The bar's backing: the page colour, a muted fill, nothing (over a cover), or a frosted blur. */
export const SCROLL_HEADER_BAR_SURFACES = ["plain", "muted", "none", "blur"] as const;
export type ScrollHeaderBarSurface = (typeof SCROLL_HEADER_BAR_SURFACES)[number];

/** Points of scroll over which the bar's surface arrives when there is no Large block to collapse. */
export const SCROLL_HEADER_NO_LARGE_FADE_DISTANCE = 24;

/**
 * The release speed, in points per millisecond, below which no momentum follows a drag — the
 * header settles on `onEndDrag`; above it, it waits for `onMomentumEnd`.
 */
export const SCROLL_HEADER_SNAP_VELOCITY = 0.15;

/** The blur bar's strength, 0-100, when `intensity` is not given. */
export const SCROLL_HEADER_DEFAULT_BLUR_INTENSITY = 40;

/**
 * Styling for a scroll header.
 *
 * The three layers are stacked by z-index, not by source order, so the caller may write the
 * parts in any order: the cover beneath the scroller (its own inline `zIndex: -1`), the
 * scroller in the flow, the `large` block above it at `z-10`, and the `bar` above everything at
 * `z-20`. Vertical placement is never a class — the safe-area band, the measured bar and the
 * measured Large block are runtime numbers, so each part places itself by style.
 *
 * Colour lives on `barTitle`, a `Text`, never on `bar` or `barRow` (package rule 1).
 */
export const scrollHeaderVariants = tv({
	slots: {
		root: "relative flex-1",
		bar: "absolute inset-x-0 top-0 z-20",
		barRow: "h-navbar-row flex-row items-center gap-2 px-screen-gutter",
		barSurface: "absolute inset-0",
		divider: "absolute inset-x-0 bottom-0 h-px bg-border",
		barTitle: "shrink text-foreground text-lg font-semibold leading-tight",
		large: "absolute inset-x-0 z-10 gap-1 px-screen-gutter pb-3",
		cover: "absolute inset-x-0 top-0 overflow-hidden",
		scrim: "absolute inset-0 bg-overlay",
	},
	variants: {
		surface: {
			plain: { barSurface: "bg-background" },
			muted: { barSurface: "bg-muted" },
			none: { barSurface: "bg-transparent" },
			blur: { barSurface: "bg-transparent" },
		},
	},
	defaultVariants: {
		surface: "plain",
	},
});

export type ScrollHeaderVariantProps = VariantProps<typeof scrollHeaderVariants>;

// Every resolver below is a self-contained worklet: each writes its own clamp
// inline and none calls another, because a module-scope helper called from a
// worklet can be missing from its closure on the UI thread (see lib/scroll-maths).

/**
 * The scroll travel over which the bar takes over: the Large block's height scaled by
 * `threshold`, clamped to 0.1..1 so the handover can come early but never instantly or late.
 */
export function resolveCollapseDistance({
	largeHeight,
	threshold,
}: {
	largeHeight: number;
	threshold: number;
}): number {
	"worklet";
	const fraction = threshold < 0.1 ? 0.1 : threshold > 1 ? 1 : threshold;
	const distance = largeHeight * fraction;
	return distance > 0 ? distance : 0;
}

/**
 * How collapsed the header is, 0 (open) to 1 (collapsed). With no distance — no Large block —
 * it is a step: collapsed as soon as anything has scrolled.
 */
export function resolveCollapseProgress(offset: number, distance: number): number {
	"worklet";
	if (distance <= 0) return offset > 0 ? 1 : 0;
	const ratio = offset / distance;
	return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

/** What the scroller must clear at rest: the safe-area band, the bar row and the Large block. */
export function resolveHeaderInset({
	safeAreaTop,
	barHeight,
	largeHeight,
}: {
	safeAreaTop: number;
	barHeight: number;
	largeHeight: number;
}): number {
	"worklet";
	return safeAreaTop + barHeight + largeHeight;
}

/**
 * The cover's height and shift for one offset.
 *
 * Scrolling up, it travels with the content. Pulled down past the top, it either grows by the
 * pull from a fixed top edge (`stretch`) or rides down with the content at its own height.
 * `0 - offset` rather than `-offset`, so a resting cover reads `+0`, not `-0`.
 */
export function resolveCoverStretch({
	offset,
	baseHeight,
	stretch,
}: {
	offset: number;
	baseHeight: number;
	stretch: boolean;
}): { height: number; translateY: number } {
	"worklet";
	if (offset < 0 && stretch) return { height: baseHeight - offset, translateY: 0 };
	return { height: baseHeight, translateY: 0 - offset };
}

/**
 * Where a settled scroller should come to rest so the header is never left half collapsed:
 * the nearer end of the collapse range, or `null` when it is already at an end, past it, or
 * pulled down — there is nothing to settle.
 */
export function resolveSnapTarget({ offset, distance }: { offset: number; distance: number }): number | null {
	"worklet";
	if (distance <= 0) return null;
	if (offset <= 0 || offset >= distance) return null;
	return offset < distance / 2 ? 0 : distance;
}

/** Fully collapsed — the moment the bar has taken over completely. */
export function isCollapsed(progress: number): boolean {
	"worklet";
	return progress >= 1;
}

/**
 * The bar surface's opacity. With a Large block it is the collapse progress; without one it
 * arrives over the first `SCROLL_HEADER_NO_LARGE_FADE_DISTANCE` points — `scrollEdgeOpacity`'s
 * start-edge ramp, written inline for the worklet reason above.
 */
export function resolveBarSurfaceOpacity({
	hasLarge,
	progress,
	offset,
}: {
	hasLarge: boolean;
	progress: number;
	offset: number;
}): number {
	"worklet";
	const ratio = hasLarge ? progress : offset / SCROLL_HEADER_NO_LARGE_FADE_DISTANCE;
	return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

/** The Large block's half of the crossfade: gone as the bar takes over. */
export function resolveLargeOpacity(progress: number): number {
	"worklet";
	const opacity = 1 - progress;
	return opacity < 0 ? 0 : opacity > 1 ? 1 : opacity;
}

/** The bar title's half of the crossfade: in as the Large block leaves. */
export function resolveBarTitleOpacity(progress: number): number {
	"worklet";
	return progress < 0 ? 0 : progress > 1 ? 1 : progress;
}
