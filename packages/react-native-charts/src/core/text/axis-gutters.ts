import type { ChartGutters } from "../geometry/chart-bounds";

export type AxisGutterInput = {
	/** Measured widths of the y-axis labels, in points. */
	readonly yLabelWidths: readonly number[];
	/** Measured widths of the x-axis labels, in points. */
	readonly xLabelWidths: readonly number[];
	/** Line height of the axis font. */
	readonly fontHeight: number;
	/** Space between a label and the plot rect. */
	readonly tickPadding?: number;
	readonly showXAxis?: boolean;
	readonly showYAxis?: boolean;
	readonly yAxisSide?: "left" | "right";
	readonly xAxisSide?: "top" | "bottom";
};

const DEFAULT_TICK_PADDING = 6;

/**
 * How much room the axes need outside the plot rect.
 *
 * This is the second half of a two-pass layout, and the reason it is only two
 * passes. Label width sets the gutter, the gutter sets the plot rect, and the
 * plot rect sets how many ticks fit — a cycle. It is broken by computing the
 * tick *values* against the whole canvas first, measuring those, and then
 * moving only the scale's range. The values never change, so the layout is a
 * pure function of the measurements and never oscillates.
 *
 * The horizontal gutters also carry the first and last x label's overhang.
 * Without it a "Jan 2026" under the leftmost tick is clipped in half by the
 * canvas edge, which reads as a rendering bug rather than a layout one.
 */
export function resolveAxisGutters(input: AxisGutterInput): ChartGutters {
	const padding = input.tickPadding ?? DEFAULT_TICK_PADDING;
	const showY = input.showYAxis ?? true;
	const showX = input.showXAxis ?? true;
	const labels = showX ? input.xLabelWidths : [];

	const widestY = showY ? widest(input.yLabelWidths) : 0;
	const yGutter = widestY === 0 ? 0 : widestY + padding;
	const xGutter = labels.length === 0 ? 0 : input.fontHeight + padding;

	const overhangLeft = (labels[0] ?? 0) / 2;
	const overhangRight = (labels[labels.length - 1] ?? 0) / 2;

	const yOnLeft = (input.yAxisSide ?? "left") === "left";
	const xOnBottom = (input.xAxisSide ?? "bottom") === "bottom";

	// A y label is centred on its tick, and the outermost ticks sit exactly on
	// the plot rect's edges — so half a line escapes at the top and half at the
	// bottom. Without this the first and last labels are sliced by the canvas,
	// which is the vertical twin of the x labels' horizontal overhang.
	const yOverhang = yGutter === 0 ? 0 : input.fontHeight / 2;

	return {
		left: Math.max(yOnLeft ? yGutter : 0, overhangLeft),
		right: Math.max(yOnLeft ? 0 : yGutter, overhangRight),
		top: Math.max(xOnBottom ? 0 : xGutter, yOverhang),
		bottom: Math.max(xOnBottom ? xGutter : 0, yOverhang),
	};
}

function widest(widths: readonly number[]): number {
	let max = 0;
	for (const width of widths) {
		if (Number.isFinite(width) && width > max) max = width;
	}
	return max;
}
