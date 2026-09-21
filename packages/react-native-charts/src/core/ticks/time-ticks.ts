import { scaleTime } from "d3-scale";
import type { DomainTuple } from "../scale/scale.types";

/**
 * Tick values across a time domain, as epoch milliseconds.
 *
 * This delegates to `scaleTime` rather than walking a fixed interval ladder,
 * and that is the single biggest thing `d3-scale` buys this package. Local
 * calendar boundaries are not evenly spaced: a DST spring-forward day is 23
 * hours, months are four different lengths, and a hand-rolled ladder that
 * snaps on epoch multiples puts every tick an hour off midnight for half the
 * year. d3-time already knows all of it.
 */
export function timeTicks(domain: DomainTuple, count: number): number[] {
	if (count <= 0) return [];
	if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) return [];
	if (domain[0] === domain[1]) return [domain[0]];
	return scaleTime()
		.domain([new Date(domain[0]), new Date(domain[1])])
		.ticks(Math.max(1, Math.round(count)))
		.map((date) => date.getTime());
}
