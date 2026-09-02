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
	 * Extra span added to each end in domain units, after `padding`.
	 *
	 * This is how a bar gets its whole width inside the plot: half a step each
	 * side, where a fraction of the extent would be a different amount for
	 * every dataset. Applied to a zero-width domain too — one bar still needs
	 * somewhere to stand.
	 */
	readonly absolutePadding?: number;
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

	const absolute = options.absolutePadding;
	if (absolute !== undefined && absolute > 0 && Number.isFinite(absolute)) {
		lo -= absolute;
		hi += absolute;
	}

	const explicitLo = options.domain?.[0];
	const explicitHi = options.domain?.[1];
	if (explicitLo !== undefined && Number.isFinite(explicitLo)) lo = explicitLo;
	if (explicitHi !== undefined && Number.isFinite(explicitHi)) hi = explicitHi;

	return [lo, hi];
}

/** Padding per axis. `x` is measured in steps, `y` as a fraction of the extent. */
export type DomainPadding = number | { readonly x?: number; readonly y?: number };

/**
 * `domainPadding` decoded to one number per axis.
 *
 * A bare number pads y only — that was the prop's contract before x padding
 * existed, and a line chart that asked for `0.1` should not grow a margin
 * beside its first point. Anything non-finite becomes zero rather than
 * reaching a scale as `NaN`.
 */
export function resolveDomainPadding(value: DomainPadding | undefined): { readonly x: number; readonly y: number } {
	if (value === undefined) return { x: 0, y: 0 };
	if (typeof value === "number") return { x: 0, y: finiteOrZero(value) };
	return { x: finiteOrZero(value.x), y: finiteOrZero(value.y) };
}

function finiteOrZero(value: number | undefined): number {
	return value !== undefined && Number.isFinite(value) ? value : 0;
}
