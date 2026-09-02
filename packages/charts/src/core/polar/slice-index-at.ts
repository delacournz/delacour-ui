/**
 * Which slice is under a canvas point, or `-1`.
 *
 * Flat worklet: it calls nothing, so it may run on the UI thread from a gesture
 * callback. The angle maths is inlined rather than shared with
 * `polar-point.ts` for that reason — see the package AGENTS.md on why a
 * module-scope worklet must not call another function.
 *
 * A slice owns its start angle and not its end, so a point exactly on a
 * boundary belongs to the later slice. A slice with no sweep owns nothing.
 */
export function sliceIndexAt(
	x: number,
	y: number,
	centerX: number,
	centerY: number,
	innerRadius: number,
	radius: number,
	startAngles: readonly number[],
	sweepAngles: readonly number[]
): number {
	"worklet";
	const dx = x - centerX;
	const dy = y - centerY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance > radius || distance < innerRadius) return -1;

	// Degrees clockwise from 12 o'clock — the same convention the slices use.
	let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
	angle = ((angle % 360) + 360) % 360;

	for (let index = 0; index < startAngles.length; index += 1) {
		const sweep = sweepAngles[index] ?? 0;
		if (!(sweep > 0)) continue;
		const start = (((startAngles[index] ?? 0) % 360) + 360) % 360;
		let relative = angle - start;
		if (relative < 0) relative += 360;
		if (relative < sweep) return index;
	}

	return -1;
}
