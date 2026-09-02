import type { DomainTuple } from "../scale/scale.types";

export const DEFAULT_TICK_COUNT = 5;

/**
 * At most `count` of `values`, evenly sampled, keeping both ends.
 *
 * For when the tick values are given rather than generated — a caller's
 * explicit `tickValues`, or a categorical axis with one tick per datum that
 * would otherwise overprint itself.
 */
export function downsampleTicks(values: readonly number[], count: number): number[] {
	if (count <= 0) return [];
	if (values.length <= count) return [...values];
	if (count === 1) return [values[0] as number];

	const last = values.length - 1;
	return Array.from({ length: count }, (_, index) => values[Math.round((index * last) / (count - 1))] as number);
}

/**
 * Exactly `count` values spread evenly across `domain`.
 *
 * Two y axes drawing their own round numbers produce two sets of gridlines at
 * different heights, and the chart reads as two charts overlaid. Giving the
 * secondary axis the primary's count puts every line in the same place, at the
 * cost of the secondary's labels no longer being round — which is the right
 * trade, because a gridline is structural and a label is not.
 */
export function normalizeTickCount(domain: DomainTuple, count: number): number[] {
	if (count <= 0) return [];
	if (count === 1) return [domain[0]];
	const span = domain[1] - domain[0];
	return Array.from({ length: count }, (_, index) => domain[0] + (span * index) / (count - 1));
}
