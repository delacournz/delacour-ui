/** Settle tolerance: a spring at rest is within this of its target. */
const SETTLE_EPSILON = 0.5;

/**
 * The index of the highest detent at or below `height`, `-1` below the
 * first. A hair under a detent counts as on it, so a spring settling a
 * fraction short is not a crossing.
 */
export function detentUnder(height: number, detents: readonly number[]): number {
	"worklet";
	let under = -1;
	for (let index = 0; index < detents.length; index += 1) {
		if (height + SETTLE_EPSILON >= (detents[index] as number)) under = index;
		else break;
	}
	return under;
}

/**
 * Whether a drag crossed a detent this frame: the detent now under the sheet
 * differs from `lastIndex`, the one the pan stored last frame. On `true` the
 * pan fires its haptic and stores `detentUnder(height, detents)`. A frame
 * that leaps two detents is one crossing, not a burst.
 */
export function crossedDetent(lastIndex: number, height: number, detents: readonly number[]): boolean {
	"worklet";
	let under = -1;
	for (let index = 0; index < detents.length; index += 1) {
		if (height + SETTLE_EPSILON >= (detents[index] as number)) under = index;
		else break;
	}
	return under !== lastIndex;
}
