import { scaleLinear, scaleLog, scaleTime } from "d3-scale";
import type { DomainTuple, RangeTuple, ScaleDescriptor, ScaleType } from "./scale.types";

/** The smallest domain a log scale can take; d3 produces garbage at or below zero. */
const LOG_FLOOR = 1e-9;

export type MakeScaleOptions = {
	readonly kind: ScaleType;
	readonly domain: DomainTuple;
	readonly range: RangeTuple;
	/**
	 * Round the domain out to values a tick would land on. `true` uses the
	 * default tick count; a number asks for that many.
	 */
	readonly nice?: boolean | number;
	/** Log base. Ignored by every other kind. */
	readonly base?: number;
};

/**
 * Builds a scale and returns only its descriptor.
 *
 * d3 does the work that is genuinely hard — `.nice()` rounding a domain out to
 * human numbers, and `scaleTime` understanding that a DST day is 23 hours —
 * and then we throw the closure away and keep the numbers. Nothing downstream
 * ever holds a d3 scale, which is what keeps the UI thread able to read one.
 */
export function makeScale(options: MakeScaleOptions): ScaleDescriptor {
	const { kind, range } = options;
	const domain = normaliseDomain(options.domain, kind);

	const nice = options.nice;

	switch (kind) {
		case "linear": {
			const scale = scaleLinear().domain([domain[0], domain[1]]).range([range[0], range[1]]);
			applyNice(scale, nice);
			const nicened = scale.domain();
			return { kind: "linear", domain: [nicened[0] as number, nicened[1] as number], range };
		}
		case "time": {
			const scale = scaleTime()
				.domain([new Date(domain[0]), new Date(domain[1])])
				.range([range[0], range[1]]);
			applyNice(scale, nice);
			const nicened = scale.domain();
			return { kind: "time", domain: [nicened[0].getTime(), nicened[1].getTime()], range };
		}
		case "log": {
			const base = options.base ?? 10;
			const scale = scaleLog().base(base).domain([domain[0], domain[1]]).range([range[0], range[1]]);
			applyNice(scale, nice);
			const nicened = scale.domain();
			return { kind: "log", domain: [nicened[0] as number, nicened[1] as number], range, base };
		}
	}
}

/** Rounds a scale's domain out in place, when the caller asked for it. */
function applyNice(scale: { nice: (count?: number) => unknown }, nice: boolean | number | undefined): void {
	if (nice === undefined || nice === false) return;
	scale.nice(nice === true ? undefined : nice);
}

/**
 * A domain d3 will not choke on.
 *
 * Two guards. A non-finite bound becomes zero, because a `NaN` domain produces
 * a `NaN` position for every point and an empty canvas with nothing logged. A
 * log domain is floored above zero, because `scaleLog` with a zero or negative
 * bound returns `-Infinity` for the whole range.
 */
function normaliseDomain(domain: DomainTuple, kind: ScaleType): DomainTuple {
	const lo = Number.isFinite(domain[0]) ? domain[0] : 0;
	const hi = Number.isFinite(domain[1]) ? domain[1] : 0;
	if (kind !== "log") return [lo, hi];
	return [Math.max(lo, LOG_FLOOR), Math.max(hi, LOG_FLOOR * 10)];
}
