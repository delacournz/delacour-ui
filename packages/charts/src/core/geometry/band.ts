import { clamp } from "../util/clamp";

/** How much of the category axis one datum owns, and how much of that a bar fills. */
export type Band = {
	/** Canvas distance from one datum to the next. */
	readonly step: number;
	/** Canvas width of a bar. */
	readonly bandwidth: number;
};

export type ResolveBandOptions = {
	/** Canvas x per row — the chart's `xPositions`. */
	readonly xPositions: readonly number[];
	readonly plotWidth: number;
	/** The fraction of the step left empty, split either side. Defaults to 0.2. */
	readonly innerPadding?: number;
	/** An exact bar width, overriding `innerPadding`. */
	readonly barWidth?: number;
	/** Divide the plot into this many steps instead of measuring the positions. */
	readonly barCount?: number;
};

/**
 * The band a bar draws in, on a scale that has no band of its own.
 *
 * There is no band scale in this package; a category sits at its index on a
 * linear scale. The step is therefore *measured* — the smallest canvas gap
 * between neighbouring positions — which on evenly spaced data is what a
 * band scale would have computed, and on a time axis with a missing month is
 * the honest answer: the narrower gap.
 *
 * `barCount` exists so several charts with different row counts can share a
 * bar width. A lone bar, or no bar, takes the whole plot as its step; it would
 * otherwise have no width at all.
 */
export function resolveBand(options: ResolveBandOptions): Band {
	const { xPositions, plotWidth, barWidth, barCount } = options;
	const width = Number.isFinite(plotWidth) && plotWidth > 0 ? plotWidth : 0;

	let step: number;
	if (barCount !== undefined && Number.isFinite(barCount) && barCount > 0) {
		step = width / barCount;
	} else {
		step = smallestGap(xPositions);
		if (step === 0) step = width;
	}

	const padding = paddingOrDefault(options.innerPadding, 0.2);
	const bandwidth = barWidth !== undefined && Number.isFinite(barWidth) ? Math.max(barWidth, 0) : step * (1 - padding);
	return { step, bandwidth };
}

export type GroupLayoutOptions = {
	readonly step: number;
	readonly seriesCount: number;
	/** The fraction of the step left empty between groups. Defaults to 0.2. */
	readonly betweenGroupPadding?: number;
	/** The fraction of each bar's slot left empty. Defaults to 0.2. */
	readonly withinGroupPadding?: number;
	readonly barWidth?: number;
};

export type GroupLayout = {
	readonly bandwidth: number;
	/** Canvas x offset of each series' bar from the datum's x, symmetric about zero. */
	readonly offsets: readonly number[];
};

/**
 * Where each series' bar sits inside a grouped step.
 *
 * The offsets are symmetric about zero so the group is centred on the datum,
 * which keeps the scrub's snapped x — the datum's x — in the middle of the
 * group rather than on its first bar.
 */
export function groupLayout(options: GroupLayoutOptions): GroupLayout {
	const { step, seriesCount, barWidth } = options;
	if (!Number.isFinite(seriesCount) || seriesCount <= 0) return { bandwidth: 0, offsets: [] };

	const between = paddingOrDefault(options.betweenGroupPadding, 0.2);
	const within = paddingOrDefault(options.withinGroupPadding, 0.2);
	const groupWidth = step * (1 - between);
	const slot = groupWidth / seriesCount;
	const bandwidth = barWidth !== undefined && Number.isFinite(barWidth) ? Math.max(barWidth, 0) : slot * (1 - within);

	const offsets: number[] = [];
	for (let index = 0; index < seriesCount; index += 1) {
		offsets.push(-groupWidth / 2 + slot * (index + 0.5));
	}
	return { bandwidth, offsets };
}

/** The smallest positive gap between neighbouring positions, or zero when there is none. */
function smallestGap(positions: readonly number[]): number {
	const sorted = positions.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
	let gap = Number.POSITIVE_INFINITY;
	for (let index = 1; index < sorted.length; index += 1) {
		const current = (sorted[index] as number) - (sorted[index - 1] as number);
		if (current > 0 && current < gap) gap = current;
	}
	return Number.isFinite(gap) ? gap : 0;
}

/**
 * A padding fraction held inside `[0, 1)`. At one a bar would have no width
 * and above it a negative one, which draws inside out.
 */
function paddingOrDefault(value: number | undefined, fallback: number): number {
	if (value === undefined || !Number.isFinite(value)) return fallback;
	return clamp(value, 0, 1 - Number.EPSILON);
}
