import type { PieSliceData, PolarPoint } from "./polar.types";
import { polarToCartesian } from "./polar-point";

/**
 * Where a slice's label sits: on the bisector, `radiusOffset` of the way
 * across the annulus.
 *
 * The offset is a fraction of the **annulus** — `0` is the inner edge, `1` the
 * outer, more than `1` outside the circle — rather than of the radius. A donut
 * with a 60% hole and a label at half the radius would put the label in the
 * hole; measuring from the inner edge keeps the same offset meaningful for a
 * pie and a donut alike.
 */
export function sliceLabelPosition(slice: PieSliceData, radiusOffset = 0.5): PolarPoint {
	const midAngle = slice.startAngle + slice.sweepAngle / 2;
	const radius = slice.innerRadius + (slice.radius - slice.innerRadius) * radiusOffset;
	return polarToCartesian(slice.center, radius, midAngle);
}
