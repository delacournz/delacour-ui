import type { ChartPoint } from "../chart.types";
import type { ScaleDescriptor } from "../scale/scale.types";

/**
 * Whether the category scale's domain reaches half a step past the first and
 * last category, which is what a bar centred on each needs to sit inside the
 * plot. `xValue` is the category in either orientation, and the caller hands
 * in whichever canvas scale holds the categories — `yScale` on a horizontal
 * chart — so the check is the same either way round.
 */
export function categoryDomainCovers(series: readonly ChartPoint[], scale: ScaleDescriptor, step: number): boolean {
	const first = series[0]?.xValue;
	const last = series[series.length - 1]?.xValue;
	if (first === undefined || last === undefined) return true;
	const half = step / 2;
	const [lo, hi] = scale.domain;
	return Math.min(first, last) - half >= lo && Math.max(first, last) + half <= hi;
}
