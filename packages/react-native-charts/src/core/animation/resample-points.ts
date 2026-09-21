import type { ChartPoint } from "../chart.types";
import type { MorphStrategy } from "./morph-strategy";

/** One point between two, at fraction `t`. A gap at either end stays a gap. */
function lerpPoint(from: ChartPoint, to: ChartPoint, t: number): ChartPoint {
	const bothPlotted = from.y !== null && to.y !== null;
	return {
		x: from.x + (to.x - from.x) * t,
		y: bothPlotted ? (from.y as number) + ((to.y as number) - (from.y as number)) * t : null,
		xValue: from.xValue + (to.xValue - from.xValue) * t,
		yValue: from.yValue !== null && to.yValue !== null ? from.yValue + (to.yValue - from.yValue) * t : null,
	};
}

/** `points` re-spread over exactly `length` places, evenly by index. */
export function resamplePoints(points: readonly ChartPoint[], length: number): readonly ChartPoint[] {
	if (length <= 0 || points.length === 0) return [];
	if (points.length === 1 || length === 1) return new Array(length).fill(points[0] as ChartPoint);

	const last = points.length - 1;
	return Array.from({ length }, (_, index) => {
		const source = (index / (length - 1)) * last;
		const lower = Math.floor(source);
		const upper = Math.min(last, lower + 1);
		return lerpPoint(points[lower] as ChartPoint, points[upper] as ChartPoint, source - lower);
	});
}

/** `points` grown to `length` by repeating an end. */
function padPoints(points: readonly ChartPoint[], length: number, end: "start" | "end"): readonly ChartPoint[] {
	if (points.length >= length || points.length === 0) return points;
	const filler = new Array(length - points.length).fill(
		end === "end" ? (points[points.length - 1] as ChartPoint) : (points[0] as ChartPoint)
	);
	return end === "end" ? [...points, ...filler] : [...filler, ...points];
}

/**
 * Two series at one length, ready to build two interpolatable paths.
 *
 * Matching happens here, in data space, and not on the finished paths. That is
 * the only place it is geometrically meaningful, and it is why
 * `useAnimatedPath` never has to fall back to snapping: two point arrays of
 * equal length through the same curve produce the same sequence of path verbs,
 * which is exactly what Skia's interpolation requires.
 */
export function matchPointCounts(
	previous: readonly ChartPoint[],
	next: readonly ChartPoint[],
	strategy: MorphStrategy
): readonly [readonly ChartPoint[], readonly ChartPoint[]] {
	if (previous.length === next.length) return [previous, next];

	const length = Math.max(previous.length, next.length);
	switch (strategy) {
		case "pad-end":
			return [padPoints(previous, length, "end"), padPoints(next, length, "end")];
		case "pad-start":
			return [padPoints(previous, length, "start"), padPoints(next, length, "start")];
		case "none":
		case "resample":
			return [resamplePoints(previous, length), resamplePoints(next, length)];
	}
}
