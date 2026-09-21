import type { ChartBounds } from "../chart.types";
import type { ChartTick } from "../ticks/tick.types";

/** One rule, as `[x1, y1, x2, y2]`. */
export type GridSegment = readonly [number, number, number, number];

export type GridAxis = "x" | "y" | "both";

export type GridSegmentOptions = {
	readonly bounds: ChartBounds;
	readonly xTicks: readonly ChartTick[];
	readonly yTicks: readonly ChartTick[];
	readonly axis?: GridAxis;
};

/**
 * The rules a grid draws, spanning the plot rect at each tick.
 *
 * A tick with a non-finite position is skipped rather than drawn at zero. That
 * happens whenever an axis has no usable domain — a log scale reaching zero,
 * say — and a rule pinned to the canvas edge reads as a real gridline the data
 * does not have.
 */
export function gridSegments(options: GridSegmentOptions): GridSegment[] {
	const { bounds, xTicks, yTicks, axis = "y" } = options;
	const segments: GridSegment[] = [];

	if (axis === "y" || axis === "both") {
		for (const tick of yTicks) {
			if (!Number.isFinite(tick.position)) continue;
			segments.push([bounds.left, tick.position, bounds.right, tick.position]);
		}
	}

	if (axis === "x" || axis === "both") {
		for (const tick of xTicks) {
			if (!Number.isFinite(tick.position)) continue;
			segments.push([tick.position, bounds.top, tick.position, bounds.bottom]);
		}
	}

	return segments;
}
