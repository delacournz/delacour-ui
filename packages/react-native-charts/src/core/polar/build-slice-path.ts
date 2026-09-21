import type { PieSliceData, PolarPoint } from "./polar.types";
import { polarToCartesian } from "./polar-point";

/** Cubics per arc. Four keeps a quarter turn each, where the error is 0.03%. */
export const ARC_SEGMENTS = 4;

/**
 * A slice as an SVG path: outer arc, a line inward, inner arc, close.
 *
 * The verb sequence is **always** `M C C C C L C C C C Z` — eleven verbs,
 * whatever the sweep and whether there is a hole. A zero sweep emits four
 * cubics with every control point on one ray; a pie with no hole emits an
 * inner arc of radius zero sitting on the centre. That constancy is what lets
 * Skia interpolate one slice into another when the data changes, and it is
 * why a slice never uses an `A` arc verb: an arc's parameters are not
 * pointwise-interpolatable and Skia would snap instead of morphing.
 *
 * The inner arc runs **counter-clockwise**. Under the nonzero winding rule the
 * opposite direction is what leaves the hole of a 360° donut empty — with the
 * arcs wound the same way, a single-slice donut fills into a disc.
 */
export function buildSlicePath(slice: PieSliceData): string {
	const { center } = slice;
	const radius = finite(slice.radius);
	const inner = finite(slice.innerRadius);
	const start = finite(slice.startAngle);
	const sweep = finite(slice.sweepAngle);
	const end = start + sweep;

	const outerStart = polarToCartesian(center, radius, start);
	const innerEnd = polarToCartesian(center, inner, end);

	return [
		`M${point(outerStart)}`,
		...arcCubics(center, radius, start, sweep),
		`L${point(innerEnd)}`,
		...arcCubics(center, inner, end, -sweep),
		"Z",
	].join("");
}

/**
 * One edge of a slice, from the inner radius to the outer, as `M L`.
 *
 * What a hairline between slices is drawn with: stroking the slice itself
 * would also outline the arcs, and a stroked arc under a fill of the same
 * colour reads as a slice that is slightly too big.
 */
export function buildSliceEdgePath(slice: PieSliceData, edge: "start" | "end"): string {
	const angle = finite(edge === "start" ? slice.startAngle : slice.endAngle);
	const from = polarToCartesian(slice.center, finite(slice.innerRadius), angle);
	const to = polarToCartesian(slice.center, finite(slice.radius), angle);
	return `M${point(from)}L${point(to)}`;
}

/**
 * An arc of `sweep` degrees from `start`, as `ARC_SEGMENTS` cubic Béziers.
 *
 * Each cubic covers an equal share of the sweep; its control points sit on the
 * tangents at either end, `4/3 · tan(θ/4)` of the radius along them, which is
 * the standard circular approximation. A negative sweep walks the other way
 * round, and the same formula holds because `tan` is odd.
 */
function arcCubics(center: PolarPoint, radius: number, start: number, sweep: number): string[] {
	const segments: string[] = [];
	const step = sweep / ARC_SEGMENTS;
	const theta = (step * Math.PI) / 180;
	const handle = (4 / 3) * Math.tan(theta / 4) * radius;

	for (let index = 0; index < ARC_SEGMENTS; index += 1) {
		const from = start + step * index;
		const to = from + step;
		const fromRadians = (from * Math.PI) / 180;
		const toRadians = (to * Math.PI) / 180;
		const p0 = polarToCartesian(center, radius, from);
		const p1 = polarToCartesian(center, radius, to);
		// The tangent at angle a, clockwise from 12 o'clock, is (cos a, sin a).
		const c1 = { x: p0.x + handle * Math.cos(fromRadians), y: p0.y + handle * Math.sin(fromRadians) };
		const c2 = { x: p1.x - handle * Math.cos(toRadians), y: p1.y - handle * Math.sin(toRadians) };
		segments.push(`C${point(c1)} ${point(c2)} ${point(p1)}`);
	}

	return segments;
}

function point({ x, y }: PolarPoint): string {
	return `${round(x)},${round(y)}`;
}

/** Three decimals — sub-pixel, and short enough that a path string stays small. */
function round(value: number): number {
	const rounded = Math.round(value * 1000) / 1000;
	return rounded === 0 ? 0 : rounded;
}

function finite(value: number): number {
	return Number.isFinite(value) ? value : 0;
}
