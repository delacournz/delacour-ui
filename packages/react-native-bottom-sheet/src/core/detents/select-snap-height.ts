export type SelectSnapHeightInput = {
	/** Where the finger let go, in height space. */
	height: number;
	/** Release velocity in height space — upward positive, so pass `-velocityY`. */
	velocity: number;
	/** Ascending detents. */
	detents: readonly number[];
	/** The closed height when closing is allowed from this gesture, else `null`. */
	closedHeight: number | null;
	/** Seconds of velocity to project — gorhom's `0.2`. */
	projection: number;
};

/**
 * The detent a released drag settles at: the candidate nearest to where the
 * finger was heading, `height + projection · velocity`.
 *
 * Closing is a candidate only when `closedHeight` is given; the pan passes
 * `null` unless `enablePanDownToClose`. On a tie the lower candidate wins.
 */
export function selectSnapHeight(input: SelectSnapHeightInput): number {
	"worklet";
	const velocity = Number.isFinite(input.velocity) ? input.velocity : 0;
	const projected = input.height + input.projection * velocity;

	let best = input.height;
	let bestDistance = Number.POSITIVE_INFINITY;

	if (input.closedHeight !== null) {
		best = input.closedHeight;
		bestDistance = Math.abs(projected - input.closedHeight);
	}

	for (let index = 0; index < input.detents.length; index += 1) {
		const candidate = input.detents[index] as number;
		const distance = Math.abs(projected - candidate);
		if (distance < bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}

	return best;
}
