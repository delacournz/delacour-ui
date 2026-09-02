import type { DomainTuple } from "../scale/scale.types";
import { extent } from "../util/extent";

/** What a scale falls back to when the data offers nothing to measure. */
export const EMPTY_DOMAIN: DomainTuple = [0, 1];

export type ResolveDomainOptions = {
	readonly values: Iterable<number | null | undefined>;
	/**
	 * Explicit bounds. Either end may be `undefined` to keep the data's own —
	 * `[0, undefined]` is the common case: pin the floor, let the ceiling grow.
	 */
	readonly domain?: readonly [number | undefined, number | undefined];
	/** Extra span added to each end, as a fraction of the measured extent. */
	readonly padding?: number;
	/**
	 * Pull zero into the domain.
	 *
	 * A bar's length is read against the axis, so a bar chart that starts at 40
	 * exaggerates every difference. A line chart usually should not — clipping
	 * to the data is what makes a trend legible.
	 */
	readonly includeZero?: boolean;
};

/**
 * The domain a scale should take.
 *
 * A constant series comes back zero-width on purpose. `scaleValue` maps that
 * to the range midpoint, so a flat series draws as a flat line through the
 * middle — which is what it is. Expanding it here would invent a spread the
 * data does not have.
 */
export function resolveDomain(options: ResolveDomainOptions): DomainTuple {
	const measured = extent(options.values);
	let lo = measured?.[0] ?? EMPTY_DOMAIN[0];
	let hi = measured?.[1] ?? EMPTY_DOMAIN[1];

	if (options.includeZero) {
		lo = Math.min(lo, 0);
		hi = Math.max(hi, 0);
	}

	const padding = options.padding;
	if (padding !== undefined && padding > 0 && Number.isFinite(padding)) {
		const span = hi - lo;
		const amount = span === 0 ? Math.abs(lo) * padding : span * padding;
		lo -= amount;
		hi += amount;
	}

	const explicitLo = options.domain?.[0];
	const explicitHi = options.domain?.[1];
	if (explicitLo !== undefined && Number.isFinite(explicitLo)) lo = explicitLo;
	if (explicitHi !== undefined && Number.isFinite(explicitHi)) hi = explicitHi;

	return [lo, hi];
}
