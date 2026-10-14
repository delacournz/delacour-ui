/**
 * The size maths every resizable region in this library shares.
 *
 * `Splitter` owns this file and `SplitView` imports it as a leaf —
 * `../splitter/splitter.math`, never `../splitter`, which would pull the whole
 * compound in and risk a cycle. Two rules hold it together, and a test pins both:
 *
 * - **It imports nothing.** No React Native, no Reanimated, no `tv`. It is
 *   reachable from `bun test` and from any worklet without dragging a renderer in.
 * - **Every export is a worklet.** These run inside gesture callbacks on the UI
 *   thread; a function without the directive throws there, and only on a device.
 *
 * Fractions are `0..1` and percentages `0..100`. Nothing here stores points, so a
 * layout survives a rotation with no code path to convert it.
 */

/**
 * The deceleration a UIScrollView uses at its normal rate, per millisecond.
 *
 * What {@link projectSnap} assumes when the caller names none, so a release
 * travels as far as the same flick would carry a scroll view.
 */
export const DEFAULT_DECELERATION_RATE = 0.998;

/** Decimal places a snapped value is rounded to, so `0.1 * 3` reads `0.3` and not `0.30000000000000004`. */
const SNAP_PRECISION = 1e9;

/** Holds `value` inside `[min, max]`. `NaN` reads as `min`, so a bad measurement never escapes. */
export function clamp(value: number, min: number, max: number): number {
	"worklet";
	if (Number.isNaN(value)) return min;
	return Math.min(Math.max(value, min), max);
}

/**
 * Rounds `value` to the nearest multiple of `step`, half up.
 *
 * A `step` of zero or less is continuous and returns `value` untouched. The result
 * is rounded once more at nine decimal places, because a fractional step leaks
 * float noise into every multiple and a screen reader reads it aloud.
 */
export function snapToStep(value: number, step: number): number {
	"worklet";
	if (!(step > 0)) return value;
	return Math.round(Math.round(value / step) * step * SNAP_PRECISION) / SNAP_PRECISION;
}

/** `35` → `0.35`. */
export function percentToFraction(percent: number): number {
	"worklet";
	return percent / 100;
}

/** `0.35` → `35`. */
export function fractionToPercent(fraction: number): number {
	"worklet";
	return fraction * 100;
}

/**
 * The index of the point closest to `position`, or `-1` when there are none.
 *
 * A tie goes to the **lower** point. That is a choice rather than an accident:
 * deterministic, and the side a resting pane falls toward.
 */
export function nearestSnapIndex(position: number, points: readonly number[]): number {
	"worklet";
	let best = -1;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let index = 0; index < points.length; index++) {
		const distance = Math.abs((points[index] as number) - position);
		if (distance < bestDistance) {
			best = index;
			bestDistance = distance;
		}
	}
	return best;
}

export type ProjectSnapOptions = {
	/** Where the release happened, as a fraction. */
	position: number;
	/** How fast it was moving, in fractions per second. Positive is toward `1`. */
	velocity: number;
	/** Ascending fractions to settle on. */
	points: readonly number[];
	/** Per-millisecond decay. Defaults to {@link DEFAULT_DECELERATION_RATE}. */
	decelerationRate?: number;
};

/**
 * The snap point a release settles on, once its momentum is spent.
 *
 * The release is projected forward the distance a decaying flick would cover —
 * `v · r / (1 − r)`, with `v` per millisecond — and the nearest point to *that*
 * wins. So a slow release settles on the closest point and a fast one is carried
 * past it, which is what makes a flick feel thrown rather than dropped.
 *
 * Always an index inside `points`, however wild the velocity; `-1` only when there
 * are no points at all.
 */
export function projectSnap({
	position,
	velocity,
	points,
	decelerationRate = DEFAULT_DECELERATION_RATE,
}: ProjectSnapOptions): number {
	"worklet";
	const rate = clamp(decelerationRate, 0, 0.9999);
	const perMillisecond = Number.isFinite(velocity) ? velocity / 1000 : 0;
	const projected = position + (perMillisecond * rate) / (1 - rate);
	return nearestSnapIndex(projected, points);
}
