import type { CurvePath } from "./path-segments";

/**
 * Bisection steps.
 *
 * 32 resolves `t` to 2⁻³² of a segment, which on a 1000-point-wide canvas is
 * about 2e-7 points of `y` — seven orders of magnitude below anything a screen
 * can show. Each step is a handful of multiplies, so the whole solve is well
 * under a microsecond and the extra headroom over the ~1e-6 that 24 steps give
 * costs nothing worth measuring.
 */
const BISECTIONS = 32;

/** Below this the segment is vertical and `x` does not select a single `y`. */
const VERTICAL_EPSILON = 1e-9;

/**
 * The `y` on the drawn curve at canvas `x`, or `NaN` where the path has none.
 *
 * This is what makes a scrub dot glide along the line rather than hop between
 * data points. It reads the same cubics the renderer drew, so the dot cannot
 * drift off the stroke however the curve was interpolated.
 *
 * **Bisection, not the analytic cubic root.** The closed-form solve is three
 * functions calling each other — `solveCubic` calling `cuberoot` — and a
 * module-scope worklet that calls another module-scope worklet binds at import
 * time in source order, so the UI thread gets `undefined is not a function`.
 * Since `x` is monotone along every segment a chart draws, bisection converges
 * provably and fits in one flat function. The exact solver lives in this
 * module's test as an oracle, which is the right place for a second
 * implementation.
 *
 * Outside the path it clamps to the nearer end. Inside a gap it returns `NaN`,
 * and the caller falls back to the nearest datum.
 *
 * Flat worklet: calls nothing, closes over nothing but the two constants above.
 *
 * It is one long function for that reason and not by preference. The obvious
 * refactor — a run scan, a segment search and a bisection as three helpers —
 * is four module-scope functions calling each other, which binds at import
 * time in source order and hands the UI thread `undefined is not a function`
 * the moment a finger lands. The complexity rule is suppressed below because
 * satisfying it here would break the code on a device.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the flat-worklet rule forbids extracting helpers; see the doc comment above.
export function getYForX(path: CurvePath, x: number): number {
	"worklet";
	if (path.length === 0 || !Number.isFinite(x)) return Number.NaN;

	const firstRun = path[0] as readonly number[];
	if (x <= (firstRun[0] as number)) return firstRun[1] as number;

	const lastRun = path[path.length - 1] as readonly number[];
	if (x >= (lastRun[lastRun.length - 2] as number)) return lastRun[lastRun.length - 1] as number;

	for (let runIndex = 0; runIndex < path.length; runIndex += 1) {
		const run = path[runIndex] as readonly number[];
		const count = (run.length - 2) / 6;
		if (count < 1) continue;
		if (x < (run[0] as number) || x > (run[run.length - 2] as number)) continue;

		let lo = 0;
		let hi = count - 1;
		let index = -1;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			const startX = run[mid * 6] as number;
			const endX = run[mid * 6 + 6] as number;
			if (x < startX) hi = mid - 1;
			else if (x > endX) lo = mid + 1;
			else {
				index = mid;
				break;
			}
		}
		if (index === -1) continue;

		const base = index * 6;
		const p0x = run[base] as number;
		const p0y = run[base + 1] as number;
		const c1x = run[base + 2] as number;
		const c1y = run[base + 3] as number;
		const c2x = run[base + 4] as number;
		const c2y = run[base + 5] as number;
		const p1x = run[base + 6] as number;
		const p1y = run[base + 7] as number;

		if (Math.abs(p1x - p0x) < VERTICAL_EPSILON) return p1y;

		let t0 = 0;
		let t1 = 1;
		let t = 0.5;
		for (let step = 0; step < BISECTIONS; step += 1) {
			t = (t0 + t1) / 2;
			const mt = 1 - t;
			const bx = mt * mt * mt * p0x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p1x;
			if (bx < x) t0 = t;
			else t1 = t;
		}

		const mt = 1 - t;
		return mt * mt * mt * p0y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p1y;
	}

	return Number.NaN;
}
