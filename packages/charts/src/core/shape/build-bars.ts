import type { ChartBounds, ChartOrientation, ChartPoint, ChartSegment } from "../chart.types";
import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { clamp } from "../util/clamp";
import { type CornerRadii, rectPath } from "./rect-path";

/** One bar, resolved to canvas edges. `top` is always above `bottom`. */
export type BarRect = {
	readonly left: number;
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	/** Whether the bar hangs below its base — its value end is its canvas bottom. */
	readonly negative: boolean;
	/** The datum's index in the series. */
	readonly index: number;
};

export type BarRectOptions = {
	readonly bandwidth: number;
	/** Canvas position along the value axis a bar stands on when its point has no base of its own. */
	readonly baseline: number;
	/** Canvas distance along the category axis added to every bar, for a group's interleaving. */
	readonly offset?: number;
	/** Bars grow up from a baseline y, or right from a baseline x. Defaults to `vertical`. */
	readonly orientation?: ChartOrientation;
	/**
	 * Corners named by their role, not their canvas position: `topLeft` and
	 * `topRight` are the value end, `bottomLeft` and `bottomRight` the base. A
	 * negative bar swaps them, so the rounded end is still the one that moves.
	 */
	readonly roundedCorners?: CornerRadii;
};

/**
 * A point that may carry its own base. A `ChartSegment` does; a `ChartPoint`
 * stands on the baseline.
 */
export type BarPoint = ChartPoint | ChartSegment;

/**
 * Each point as a bar rect, centred on its x.
 *
 * A gap is a zero-height rect at the baseline rather than a dropped bar.
 * Dropping it would shift every later bar's index, and a stacked chart would
 * pair the wrong segments — and the path would lose nine verbs, which is a
 * snap instead of a morph the next time that datum has a value.
 */
export function barRects(points: readonly BarPoint[], options: BarRectOptions): BarRect[] {
	const { bandwidth, baseline, offset = 0, orientation = "vertical" } = options;
	const horizontal = orientation === "horizontal";
	const half = bandwidth / 2;

	return points.map((point, index) => {
		const centre = (horizontal ? (point.y ?? Number.NaN) : point.x) + offset;
		const base = baseOf(point, baseline);
		const measured = horizontal ? point.x : point.y;
		const value = measured !== null && Number.isFinite(measured) && Number.isFinite(base) ? measured : base;
		if (horizontal) {
			return {
				left: Math.min(value, base),
				right: Math.max(value, base),
				top: centre - half,
				bottom: centre + half,
				negative: value < base,
				index,
			};
		}
		return {
			left: centre - half,
			right: centre + half,
			top: Math.min(value, base),
			bottom: Math.max(value, base),
			negative: value > base,
			index,
		};
	});
}

/** Where a point stands: its own `y0` when it is a segment with one, else the baseline. */
function baseOf(point: BarPoint, baseline: number): number {
	if ("y0" in point && point.y0 !== null && Number.isFinite(point.y0)) return point.y0;
	return baseline;
}

/**
 * Rects to one path, with corners resolved per rect.
 *
 * `roundedCorners` may be one set for every bar or one per rect, for a stack
 * that rounds only its outermost segment. Corners are stated in value/base
 * terms and rotated here for a negative bar.
 */
export function barsPathFromRects(
	rects: readonly BarRect[],
	roundedCorners?: CornerRadii | readonly (CornerRadii | undefined)[],
	orientation: ChartOrientation = "vertical"
): string {
	let path = "";
	for (let index = 0; index < rects.length; index += 1) {
		const rect = rects[index] as BarRect;
		const radii = Array.isArray(roundedCorners) ? roundedCorners[index] : (roundedCorners as CornerRadii | undefined);
		path += rectPath(
			rect.left,
			rect.top,
			rect.right,
			rect.bottom,
			orientCorners(radii ?? {}, rect.negative, orientation)
		);
	}
	return path;
}

/**
 * Value-end corners onto whichever canvas edge the value end is: the top of a
 * positive vertical bar, the bottom of a negative one, the right of a positive
 * horizontal bar, the left of a negative one.
 */
function orientCorners(radii: CornerRadii, negative: boolean, orientation: ChartOrientation): CornerRadii {
	if (orientation === "horizontal") {
		return negative
			? {
					topLeft: radii.topRight,
					bottomLeft: radii.topLeft,
					bottomRight: radii.bottomLeft,
					topRight: radii.bottomRight,
				}
			: {
					topRight: radii.topLeft,
					bottomRight: radii.topRight,
					bottomLeft: radii.bottomRight,
					topLeft: radii.bottomLeft,
				};
	}
	if (!negative) return radii;
	return {
		topLeft: radii.bottomLeft,
		topRight: radii.bottomRight,
		bottomRight: radii.topRight,
		bottomLeft: radii.topLeft,
	};
}

/** Points straight to one path of bars. */
export function buildBarsPath(points: readonly BarPoint[], options: BarRectOptions): string {
	return barsPathFromRects(barRects(points, options), options.roundedCorners, options.orientation);
}

/**
 * Where bars stand: the position of zero on the value scale, held inside the
 * plot. A y on a vertical chart, an x on a horizontal one.
 *
 * Zero can lie outside a domain that was pinned or padded away from it; a bar
 * based there would draw off the canvas. A log scale has no zero at all, so
 * its bars stand on the plot's bottom — or left — edge.
 */
export function resolveBaseline(
	valueScale: ScaleDescriptor,
	bounds: ChartBounds,
	orientation: ChartOrientation = "vertical"
): number {
	if (orientation === "horizontal") {
		if (valueScale.kind === "log") return bounds.left;
		return clamp(scaleValue(valueScale, 0), bounds.left, bounds.right);
	}
	if (valueScale.kind === "log") return bounds.bottom;
	return clamp(scaleValue(valueScale, 0), bounds.top, bounds.bottom);
}
