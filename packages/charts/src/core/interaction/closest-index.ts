/**
 * Index of the value in `xs` nearest to `x`.
 *
 * `xs` must ascend — a chart's x values do, because the scales are built from
 * their extent and the data is plotted in order.
 *
 * Flat worklet: calls nothing, closes over nothing. It runs on every frame of
 * a scrub, which is the reason it is a binary search and not a linear scan.
 */
export function closestIndex(xs: readonly number[], x: number): number {
	"worklet";
	const count = xs.length;
	if (count === 0) return -1;
	if (count === 1) return 0;

	let lo = 0;
	let hi = count - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if ((xs[mid] as number) <= x) lo = mid;
		else hi = mid;
	}

	const loDistance = Math.abs((xs[lo] as number) - x);
	const hiDistance = Math.abs((xs[hi] as number) - x);
	return hiDistance < loDistance ? hi : lo;
}
