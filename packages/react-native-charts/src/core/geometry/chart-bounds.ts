import type { ChartBounds, ChartSize } from "../chart.types";
import { type SidedNumber, sidesOf } from "../util/sided-number";

/** Space each axis reserves outside the plot rect, in points. */
export type ChartGutters = {
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
};

export const NO_GUTTERS: ChartGutters = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * The plot rect — the canvas minus the caller's padding and the axis gutters.
 *
 * Collapses to a zero-size rect at the top-left rather than inverting when the
 * gutters exceed the canvas. That happens for real on the first frame, before
 * `onLayout` has reported a size, and an inverted rect produces a negative
 * scale range that draws every mark mirrored off-screen.
 */
export function getChartBounds(
	size: ChartSize,
	padding: SidedNumber | undefined,
	gutters: ChartGutters = NO_GUTTERS
): ChartBounds {
	const pad = sidesOf(padding);
	const width = Number.isFinite(size.width) ? Math.max(0, size.width) : 0;
	const height = Number.isFinite(size.height) ? Math.max(0, size.height) : 0;

	const left = pad.left + gutters.left;
	const top = pad.top + gutters.top;
	const right = width - pad.right - gutters.right;
	const bottom = height - pad.bottom - gutters.bottom;

	return {
		left,
		top,
		right: Math.max(left, right),
		bottom: Math.max(top, bottom),
	};
}

/** Whether a rect has room to draw in. */
export function hasArea(bounds: ChartBounds): boolean {
	return bounds.right > bounds.left && bounds.bottom > bounds.top;
}
