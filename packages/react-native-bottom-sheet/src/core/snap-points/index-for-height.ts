import { CLOSED_INDEX } from "../sheet.types";

/**
 * The index a height corresponds to: `-1` closed, `0` the lowest snap point,
 * fractional in between, clamped at both ends.
 *
 * Piecewise-linear over `[closedHeight, ...snapPoints]` → `[-1, 0, 1, …]`. It is
 * fed `base`, never `height`, so a keyboard lift moves the sheet without
 * moving the index or the backdrop that follows it.
 */
export function indexForHeight(height: number, snapPoints: readonly number[], closedHeight: number): number {
	"worklet";
	const count = snapPoints.length;
	if (count === 0 || height <= closedHeight) return CLOSED_INDEX;

	let lower = closedHeight;
	for (let index = 0; index < count; index += 1) {
		const upper = snapPoints[index] as number;
		if (height <= upper) {
			const span = upper - lower;
			if (span <= 0) return index;
			return index - 1 + (height - lower) / span;
		}
		lower = upper;
	}
	return count - 1;
}

/**
 * The inverse: the height at an index, `-1` being the closed height. Integers
 * land on snap points, fractions interpolate, and an out-of-range index clamps.
 */
export function heightForIndex(index: number, snapPoints: readonly number[], closedHeight: number): number {
	"worklet";
	const count = snapPoints.length;
	if (count === 0 || index <= CLOSED_INDEX) return closedHeight;
	if (index >= count - 1) return snapPoints[count - 1] as number;

	const upperIndex = Math.ceil(index);
	const lower = upperIndex === 0 ? closedHeight : (snapPoints[upperIndex - 1] as number);
	const upper = snapPoints[upperIndex] as number;
	const fraction = index - (upperIndex - 1);
	return lower + (upper - lower) * fraction;
}
