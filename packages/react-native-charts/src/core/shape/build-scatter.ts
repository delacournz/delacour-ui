import type { ChartOrientation, ChartPoint } from "../chart.types";
import { KAPPA } from "./rect-path";

export type ScatterShape = "circle" | "square" | "star";

/** A star's inner vertices sit at this fraction of the radius — the golden-ratio pentagram. */
const STAR_INNER = 0.382;

export type ScatterPathOptions = {
	/** One radius for every point, or one per point. */
	readonly radius: number | ((point: ChartPoint, index: number) => number);
	readonly shape?: ScatterShape;
	/** Canvas position along the value axis a gap's collapsed shape sits at, so it grows out of the axis when it gains a value. */
	readonly baseline: number;
	/** Whether the value axis is y (the default) or x. */
	readonly orientation?: ChartOrientation;
};

/**
 * One shape per point, all in one path.
 *
 * Each shape has a fixed verb sequence — a circle is four cubics, a square
 * three lines, a star nine — and a gap or an unreadable radius emits the same
 * shape at radius zero rather than nothing. That keeps two series of equal
 * length interpolatable whatever their values, which is what lets a scatter
 * animate a data change instead of snapping.
 */
export function buildScatterPath(points: readonly ChartPoint[], options: ScatterPathOptions): string {
	const { radius, shape = "circle", baseline, orientation = "vertical" } = options;
	const horizontal = orientation === "horizontal";
	let path = "";

	for (let index = 0; index < points.length; index += 1) {
		const point = points[index] as ChartPoint;
		const gap = point.y === null || !Number.isFinite(point.y) || !Number.isFinite(point.x);
		const requested = typeof radius === "function" ? radius(point, index) : radius;
		const r = gap || !Number.isFinite(requested) || requested < 0 ? 0 : requested;
		const x = gap && horizontal ? baseline : point.x;
		const y = gap && !horizontal ? baseline : (point.y as number);
		path += shapePath(shape, x, y, r);
	}

	return path;
}

function shapePath(shape: ScatterShape, cx: number, cy: number, r: number): string {
	switch (shape) {
		case "circle":
			return circlePath(cx, cy, r);
		case "square":
			return `M${cx - r},${cy - r}L${cx + r},${cy - r}L${cx + r},${cy + r}L${cx - r},${cy + r}Z`;
		case "star":
			return starPath(cx, cy, r);
	}
}

/** A circle as four cubics, starting at the top and running clockwise. */
function circlePath(cx: number, cy: number, r: number): string {
	const k = r * KAPPA;
	return (
		`M${cx},${cy - r}` +
		`C${cx + k},${cy - r},${cx + r},${cy - k},${cx + r},${cy}` +
		`C${cx + r},${cy + k},${cx + k},${cy + r},${cx},${cy + r}` +
		`C${cx - k},${cy + r},${cx - r},${cy + k},${cx - r},${cy}` +
		`C${cx - r},${cy - k},${cx - k},${cy - r},${cx},${cy - r}` +
		"Z"
	);
}

/** A five-pointed star, first vertex straight up, alternating outer and inner radii. */
function starPath(cx: number, cy: number, r: number): string {
	let path = "";
	for (let vertex = 0; vertex < 10; vertex += 1) {
		const distance = vertex % 2 === 0 ? r : r * STAR_INNER;
		const angle = -Math.PI / 2 + (vertex * Math.PI) / 5;
		const x = cx + Math.cos(angle) * distance;
		const y = cy + Math.sin(angle) * distance;
		path += `${vertex === 0 ? "M" : "L"}${x},${y}`;
	}
	return `${path}Z`;
}
