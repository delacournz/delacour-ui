import { scaleLinear, scaleLog } from "d3-scale";
import type { DomainTuple } from "../scale/scale.types";
import { downsampleTicks } from "./tick-count";

/**
 * Human tick values across a linear domain.
 *
 * `count` is a suggestion, not a promise — d3 returns whatever number of round
 * values fits, which is the whole point. Asking for five over `[0, 97]` gets
 * you `0 20 40 60 80` and not five ugly nineteenths.
 *
 * Routed through a throwaway `scaleLinear` rather than `d3-array`'s `ticks` so
 * the package's declared dependencies stay `d3-scale` and `d3-shape`.
 */
export function linearTicks(domain: DomainTuple, count: number): number[] {
	if (count <= 0) return [];
	if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1])) return [];
	if (domain[0] === domain[1]) return [domain[0]];
	return scaleLinear()
		.domain([domain[0], domain[1]])
		.ticks(Math.max(1, Math.round(count)));
}

/**
 * Tick values across a log domain — decade powers when the span is wide,
 * intermediate multiples when it is narrow.
 *
 * d3's log ticks treat `count` as a floor, not a ceiling: it thins only once
 * there are more decades than ticks asked for, and otherwise returns every
 * `k · base^i` for `k` in `1…base-1`. Three decades at a requested five ticks
 * is twenty-eight values, which overprints itself into a grey smear. So when
 * the generator overshoots we drop to the decade powers alone, and thin those
 * only if there are still too many.
 */
export function logTicks(domain: DomainTuple, base: number, count: number): number[] {
	if (count <= 0) return [];
	if (domain[0] <= 0 || domain[1] <= 0 || domain[0] === domain[1]) return [];

	const wanted = Math.max(1, Math.round(count));
	const generated = scaleLog().base(base).domain([domain[0], domain[1]]).ticks(wanted);
	if (generated.length <= wanted) return generated;

	const decades = decadePowers(domain, base);
	if (decades.length === 0) return downsampleTicks(generated, wanted);
	return decades.length <= wanted ? decades : downsampleTicks(decades, wanted);
}

/**
 * Every whole power of `base` inside the domain, low to high.
 *
 * The epsilon is load-bearing. `Math.log(1000) / Math.log(10)` is
 * 2.9999999999999996, so a bare `floor` drops the top decade and a chart
 * domained `[1, 1000]` loses its 1000 tick — the one label the axis most
 * needs. Nudging by a billionth of a decade costs nothing and fixes every
 * exact power.
 */
const DECADE_EPSILON = 1e-9;

function decadePowers(domain: DomainTuple, base: number): number[] {
	const lo = Math.min(domain[0], domain[1]);
	const hi = Math.max(domain[0], domain[1]);
	const logBase = Math.log(base);
	const first = Math.ceil(Math.log(lo) / logBase - DECADE_EPSILON);
	const last = Math.floor(Math.log(hi) / logBase + DECADE_EPSILON);
	if (!Number.isFinite(first) || !Number.isFinite(last) || last < first) return [];
	return Array.from({ length: last - first + 1 }, (_, index) => base ** (first + index));
}
