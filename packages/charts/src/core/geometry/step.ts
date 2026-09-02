/**
 * The smallest gap between two distinct finite values — the width one datum
 * can claim before it touches its neighbour.
 *
 * Measured in domain units, so a monthly series on a time scale reports
 * roughly a month and a categorical one reports one. It is what `xStep` and
 * the x domain padding are stated in.
 *
 * Fewer than two distinct values return one, never zero: a zero step gives
 * every bar a zero width and pads the domain by nothing, and a lone bar
 * vanishes with nothing logged.
 */
export function resolveStep(values: readonly number[]): number {
	const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
	let step = Number.POSITIVE_INFINITY;
	for (let index = 1; index < sorted.length; index += 1) {
		const gap = (sorted[index] as number) - (sorted[index - 1] as number);
		if (gap > 0 && gap < step) step = gap;
	}
	return Number.isFinite(step) && step > 0 ? step : 1;
}
