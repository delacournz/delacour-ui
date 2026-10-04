/** Settle tolerance: a spring at rest is within this of its target. */
const SETTLE_EPSILON = 0.5;

/**
 * The index of the highest snap point at or below `height`, `-1` below the
 * first. A hair under a snap point counts as on it, so a spring settling a
 * fraction short is not a crossing.
 */
export function snapPointUnder(height: number, snapPoints: readonly number[]): number {
	"worklet";
	let under = -1;
	for (let index = 0; index < snapPoints.length; index += 1) {
		if (height + SETTLE_EPSILON >= (snapPoints[index] as number)) under = index;
		else break;
	}
	return under;
}

/**
 * Whether a drag crossed a snap point this frame: the snap point now under the sheet
 * differs from `lastIndex`, the one the pan stored last frame. On `true` the
 * pan fires its haptic and stores `snapPointUnder(height, snapPoints)`. A frame
 * that leaps two snap points is one crossing, not a burst.
 */
export function crossedSnapPoint(lastIndex: number, height: number, snapPoints: readonly number[]): boolean {
	"worklet";
	let under = -1;
	for (let index = 0; index < snapPoints.length; index += 1) {
		if (height + SETTLE_EPSILON >= (snapPoints[index] as number)) under = index;
		else break;
	}
	return under !== lastIndex;
}
