/**
 * How two series of different lengths are brought to a common point count.
 *
 * Named for which end of the shorter array is padded, not for what changed.
 */
export type MorphStrategy = "none" | "pad-end" | "pad-start" | "resample";

/** How closely two x-series must agree to count as the same points. */
const X_EPSILON = 1e-6;

/**
 * The strategy that makes a data change read correctly.
 *
 * The choice is the whole reason this module exists. Every strategy produces
 * two arrays of equal length and so a pair of interpolatable paths; only one
 * of them produces motion that means what the data did.
 *
 * - Points appended to the end — the streaming case — pad the previous series
 *   at its end, so the new tail grows out of where the line stopped instead of
 *   the whole line sliding left.
 * - Points dropped from the front — a rolling window — pad the next series at
 *   its start, so the departing head collapses into the first survivor.
 * - Anything else resamples both, which is the honest answer when the two
 *   series are not versions of each other.
 */
export function chooseMorphStrategy(previousXs: readonly number[], nextXs: readonly number[]): MorphStrategy {
	if (previousXs.length === nextXs.length) return "none";
	if (previousXs.length === 0 || nextXs.length === 0) return "resample";

	const shorter = previousXs.length < nextXs.length ? previousXs : nextXs;
	const longer = previousXs.length < nextXs.length ? nextXs : previousXs;

	let prefixMatches = true;
	for (let index = 0; index < shorter.length; index += 1) {
		if (Math.abs((shorter[index] as number) - (longer[index] as number)) > X_EPSILON) {
			prefixMatches = false;
			break;
		}
	}
	if (prefixMatches) return "pad-end";

	const offset = longer.length - shorter.length;
	let suffixMatches = true;
	for (let index = 0; index < shorter.length; index += 1) {
		if (Math.abs((shorter[index] as number) - (longer[index + offset] as number)) > X_EPSILON) {
			suffixMatches = false;
			break;
		}
	}
	if (suffixMatches) return "pad-start";

	return "resample";
}
