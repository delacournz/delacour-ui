/** The shortest interval handed to Skia — a zero-length dash draws nothing at all under a butt cap, and only a cap's dot under a round one. */
const MIN_INTERVAL = 0.01;

/**
 * A dash's visible on/off lengths as the intervals Skia's dash effect takes.
 *
 * Skia measures a dash along the path before the cap is applied, and a round
 * or square cap reaches half a stroke width past **both** ends of every dash.
 * Handed the caller's lengths unchanged, a 2-point line dashed `[6, 4]` draws
 * 8-point dashes with 2-point gaps, and a gap shorter than the stroke closes
 * up into a solid line — the cue the dash was there to give is gone. So one
 * width is moved from each dash into the gap after it, and the lengths the
 * caller wrote are the lengths that show. A butt cap ends where the dash does
 * and needs nothing.
 *
 * Pure, worklet-free and Skia-free, so it is unit-testable.
 */
export function dashIntervals(
	dash: readonly [number, number],
	strokeWidth: number,
	cap: "butt" | "round" | "square"
): [number, number] {
	const width = cap === "butt" || !Number.isFinite(strokeWidth) ? 0 : Math.max(0, strokeWidth);
	const on = Number.isFinite(dash[0]) ? dash[0] : 0;
	const off = Number.isFinite(dash[1]) ? dash[1] : 0;
	return [Math.max(MIN_INTERVAL, on - width), Math.max(MIN_INTERVAL, off + width)];
}
