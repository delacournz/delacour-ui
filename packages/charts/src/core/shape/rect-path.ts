/** A radius per corner. A missing corner is square. */
export type CornerRadii = {
	readonly topLeft?: number;
	readonly topRight?: number;
	readonly bottomRight?: number;
	readonly bottomLeft?: number;
};

/**
 * The control-point distance, as a fraction of the radius, at which a cubic
 * best approximates a quarter circle. Standard value: `4(√2 − 1) / 3`.
 */
export const KAPPA = 0.5522847498;

/**
 * A rectangle as an SVG path whose every corner is a cubic.
 *
 * Always `M C L C L C L C Z` — nine verbs — whether a corner is rounded or
 * not. A square corner is a cubic whose four points coincide. That is the
 * animation invariant: Skia interpolates two paths only when their verbs
 * match, so a bar that goes from square to rounded, or from a value to a gap,
 * has to keep the same verb sequence or it snaps instead of morphing.
 *
 * Radii are clamped to half the shorter side so a tall thin bar rounds into a
 * capsule rather than folding the path over itself.
 */
export function rectPath(left: number, top: number, right: number, bottom: number, radii: CornerRadii): string {
	const x0 = Math.min(left, right);
	const x1 = Math.max(left, right);
	const y0 = Math.min(top, bottom);
	const y1 = Math.max(top, bottom);
	const limit = Math.min((x1 - x0) / 2, (y1 - y0) / 2);

	const tl = clampRadius(radii.topLeft, limit);
	const tr = clampRadius(radii.topRight, limit);
	const br = clampRadius(radii.bottomRight, limit);
	const bl = clampRadius(radii.bottomLeft, limit);

	return (
		`M${x0},${y0 + tl}` +
		corner(x0, y0 + tl, x0, y0, x0 + tl, y0) +
		`L${x1 - tr},${y0}` +
		corner(x1 - tr, y0, x1, y0, x1, y0 + tr) +
		`L${x1},${y1 - br}` +
		corner(x1, y1 - br, x1, y1, x1 - br, y1) +
		`L${x0 + bl},${y1}` +
		corner(x0 + bl, y1, x0, y1, x0, y1 - bl) +
		"Z"
	);
}

/** A radius that is finite, non-negative and no more than `limit`. */
function clampRadius(radius: number | undefined, limit: number): number {
	if (radius === undefined || !Number.isFinite(radius) || radius <= 0) return 0;
	return Math.min(radius, Math.max(limit, 0));
}

/**
 * A cubic from `(ax, ay)` to `(bx, by)` bowing toward the corner `(cx, cy)`.
 * With the corner on both points it is a cubic of zero length, which is what
 * keeps the verb count fixed.
 */
function corner(ax: number, ay: number, cx: number, cy: number, bx: number, by: number): string {
	const c1x = ax + (cx - ax) * KAPPA;
	const c1y = ay + (cy - ay) * KAPPA;
	const c2x = bx + (cx - bx) * KAPPA;
	const c2y = by + (cy - by) * KAPPA;
	return `C${c1x},${c1y},${c2x},${c2y},${bx},${by}`;
}
