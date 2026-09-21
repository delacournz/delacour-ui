/**
 * `value` held inside `[min, max]`.
 *
 * Flat worklet: it calls nothing and closes over nothing, so it is safe to
 * reference from a gesture callback on the UI thread. See the package
 * AGENTS.md — a module-scope worklet that calls another module-scope worklet
 * binds at import time in source order, and the UI thread gets
 * `undefined is not a function`.
 */
export function clamp(value: number, min: number, max: number): number {
	"worklet";
	if (min > max) return value;
	if (value < min) return min;
	if (value > max) return max;
	return value;
}
