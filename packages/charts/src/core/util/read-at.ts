/**
 * `list[index]` as a number, with a null, a missing index or the `-1` that
 * means "no datum" all reading as `NaN`.
 *
 * Flat worklet: it calls nothing and closes over nothing, so the scrub can
 * read a series on the UI thread without a branch per field. `NaN` rather
 * than a throw because a shared value that is never written is a dot parked
 * off-screen, and a worklet that throws is a chart that stops responding.
 */
export function readAt(list: readonly (number | null)[], index: number): number {
	"worklet";
	const value = list[index];
	return value === null || value === undefined ? Number.NaN : value;
}
