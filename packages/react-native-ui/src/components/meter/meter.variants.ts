import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import {
	PROGRESS_COLORS,
	PROGRESS_DEFAULT_COLOR,
	PROGRESS_DEFAULT_SIZE,
	PROGRESS_MAX_VALUE,
	PROGRESS_MIN_VALUE,
	PROGRESS_SIZES,
} from "../progress/progress.variants";

/**
 * What a meter's colour can say. The progress bar's set, re-exported rather than
 * restated, because a meter is that bar with a judgement about the reading — the
 * two have to name a colour with the same word.
 */
export const METER_COLORS = PROGRESS_COLORS;

export const METER_SIZES = PROGRESS_SIZES;

export type MeterColor = (typeof METER_COLORS)[number];
export type MeterSize = (typeof METER_SIZES)[number];

export const METER_DEFAULT_COLOR: MeterColor = PROGRESS_DEFAULT_COLOR;
export const METER_DEFAULT_SIZE: MeterSize = PROGRESS_DEFAULT_SIZE;

/** The scale a meter covers when the caller names none, or names one that is not a finite number. */
export const METER_MIN_VALUE = PROGRESS_MIN_VALUE;
export const METER_MAX_VALUE = PROGRESS_MAX_VALUE;

/** The most blocks a segmented meter draws. Past this a block is thinner than its own gap. */
export const METER_MAX_SEGMENTS = 100;

/** How long a block takes to light or go dark. Instant under the system's reduce-motion setting. */
export const METER_SEGMENT_FADE_MS = 180;

/**
 * Where a reading falls against `low`, `high` and `optimum`.
 *
 * `optimum` is the good region, `suboptimum` the one next to it, `critical` the
 * far side of that — the three regions a gauge with a preferred end has.
 */
export const METER_REGIONS = ["optimum", "suboptimum", "critical"] as const;

export type MeterRegion = (typeof METER_REGIONS)[number];

/** What each region paints the fill. Fixed, so a region reads the same in every meter in an app. */
export const METER_REGION_COLORS: Record<MeterRegion, MeterColor> = {
	optimum: "success",
	suboptimum: "warning",
	critical: "destructive",
};

/** A point on the scale where the colour changes. `from` is in the value's own units, not a percentage. */
export type MeterThreshold = { from: number; color: MeterColor };

/**
 * How a meter decides its colour.
 *
 * - `plain` — the `color` prop, whatever the reading.
 * - `regions` — `low`, `high` and `optimum` split the scale into good, worse and
 *   worst, painted {@link METER_REGION_COLORS}.
 * - `thresholds` — the highest `from` the reading has reached names the colour.
 */
export type MeterScale =
	| { kind: "plain" }
	| { kind: "regions"; low: number | undefined; high: number | undefined; optimum: number | undefined }
	| { kind: "thresholds"; thresholds: readonly MeterThreshold[] };

/**
 * Styling for a segmented meter's blocks.
 *
 * The continuous bar is `Progress.Track` and `Progress.Fill` as they stand, so
 * only the blocks need slots of their own. **An unlit block is the progress
 * track's groove**, `bg-secondary`, and a lit one the progress fill's colour, so
 * a segmented meter and a continuous one in one card read as one instrument;
 * the tests pin both against `progressVariants`.
 *
 * **The lit colour is a layer over the block, not the block's own background.**
 * It fades its opacity in and out, which a background colour cannot do on the UI
 * thread without interpolating two token values in JavaScript.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const meterVariants = tv({
	slots: {
		/** The row of blocks. */
		segments: "w-full flex-row gap-1",
		/** One block: an unlit groove clipping its lit layer. */
		segment: "relative flex-1 overflow-hidden rounded-full bg-secondary",
		/** The lit layer. Its opacity is animated, never a class. */
		segmentFill: "absolute inset-0 rounded-full",
	},
	variants: {
		size: {
			sm: { segment: "h-1" },
			md: { segment: "h-2" },
			lg: { segment: "h-3", segments: "gap-1.5" },
		},
		color: {
			default: { segmentFill: "bg-foreground" },
			primary: { segmentFill: "bg-primary" },
			success: { segmentFill: "bg-success" },
			warning: { segmentFill: "bg-warning" },
			destructive: { segmentFill: "bg-destructive" },
			info: { segmentFill: "bg-info" },
		},
	},
	defaultVariants: {
		color: METER_DEFAULT_COLOR,
		size: METER_DEFAULT_SIZE,
	},
});

/**
 * A scale that is finite and ordered.
 *
 * A bound that is not a finite number takes the documented default, and an
 * inverted or empty scale collapses at its floor — so it reads as empty rather
 * than handing a negative span to the fill or `NaN` to the accessibility value.
 */
export function meterRange(minValue: number, maxValue: number): { minValue: number; maxValue: number } {
	const min = Number.isFinite(minValue) ? minValue : METER_MIN_VALUE;
	const max = Number.isFinite(maxValue) ? maxValue : METER_MAX_VALUE;
	return { maxValue: max < min ? min : max, minValue: min };
}

/**
 * The reading, on the scale.
 *
 * Clamped to its ends. `NaN` reads at the floor; an infinity is a direction, so
 * it reads at the end it points to.
 */
export function meterValue(value: number, minValue: number, maxValue: number): number {
	if (Number.isNaN(value)) return minValue;
	return value < minValue ? minValue : value > maxValue ? maxValue : value;
}

function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/**
 * Which region a reading falls in.
 *
 * `low` and `high` default to the scale's ends and `optimum` to its middle; each
 * is clamped into the scale, and `high` is never below `low`, so a boundary
 * written the wrong way round is pulled into order rather than inverting every
 * region.
 *
 * - **`optimum` below `low`** — the bottom is good: a disk. Below `low` is
 *   `optimum`, up to `high` is `suboptimum`, above it `critical`.
 * - **`optimum` above `high`** — the top is good: a battery. The same, mirrored.
 * - **`optimum` between them** — the band is good and either side is
 *   `suboptimum`: a room's temperature.
 */
export function resolveMeterRegion({
	value,
	minValue,
	maxValue,
	low,
	high,
	optimum,
}: {
	value: number;
	minValue: number;
	maxValue: number;
	low?: number;
	high?: number;
	optimum?: number;
}): MeterRegion {
	const reading = meterValue(value, minValue, maxValue);
	const lowBound = clamp(low ?? minValue, minValue, maxValue);
	const highBound = clamp(high ?? maxValue, lowBound, maxValue);
	const best = clamp(optimum ?? (minValue + maxValue) / 2, minValue, maxValue);

	if (best < lowBound) {
		if (reading < lowBound) return "optimum";
		return reading <= highBound ? "suboptimum" : "critical";
	}
	if (best > highBound) {
		if (reading > highBound) return "optimum";
		return reading >= lowBound ? "suboptimum" : "critical";
	}
	return reading >= lowBound && reading <= highBound ? "optimum" : "suboptimum";
}

/**
 * The colour of the highest threshold the reading has reached, or `undefined`
 * below all of them.
 *
 * The order the thresholds are listed in does not matter, and one whose `from`
 * is not a finite number is ignored.
 */
export function thresholdColor(value: number, thresholds: readonly MeterThreshold[]): MeterColor | undefined {
	let reached: MeterThreshold | undefined;
	for (const threshold of thresholds) {
		if (!Number.isFinite(threshold.from) || threshold.from > value) continue;
		if (reached === undefined || threshold.from >= reached.from) reached = threshold;
	}
	return reached?.color;
}

/** What a meter was given to judge its reading by. */
export type MeterScaleInput = {
	low?: number;
	high?: number;
	optimum?: number;
	thresholds?: readonly MeterThreshold[];
};

/** Settles which way a meter decides its colour — see {@link MeterScale}. */
export function resolveMeterScale({ low, high, optimum, thresholds }: MeterScaleInput): MeterScale {
	if (thresholds !== undefined) return { kind: "thresholds", thresholds };
	if (low !== undefined || high !== undefined || optimum !== undefined) {
		return { high, kind: "regions", low, optimum };
	}
	return { kind: "plain" };
}

/**
 * The colour the fill is painted, and the region it was judged to be in.
 *
 * `region` is `null` unless the scale is `regions`; it is what a readout or a
 * `valueLabel` reads to put the judgement into words, because colour alone is
 * not an answer for anyone who cannot see it.
 */
export function resolveMeterColor({
	value,
	minValue,
	maxValue,
	color,
	scale,
}: {
	value: number;
	minValue: number;
	maxValue: number;
	color: MeterColor;
	scale: MeterScale;
}): { color: MeterColor; region: MeterRegion | null } {
	const reading = meterValue(value, minValue, maxValue);
	switch (scale.kind) {
		case "plain":
			return { color, region: null };
		case "thresholds":
			return { color: thresholdColor(reading, scale.thresholds) ?? color, region: null };
		case "regions": {
			const region = resolveMeterRegion({ ...scale, maxValue, minValue, value: reading });
			return { color: METER_REGION_COLORS[region], region };
		}
	}
}

/**
 * How many blocks to draw, or `null` for the continuous bar.
 *
 * A fractional count rounds down and a count above {@link METER_MAX_SEGMENTS}
 * clamps to it. A count under one, or one that is not a finite number, falls
 * back to the bar rather than drawing nothing.
 */
export function meterSegmentCount(segments: number | undefined): number | null {
	if (segments === undefined || !Number.isFinite(segments)) return null;
	const count = Math.floor(segments);
	if (count < 1) return null;
	return count > METER_MAX_SEGMENTS ? METER_MAX_SEGMENTS : count;
}

/** Absorbs floating-point error, so `0.7 × 10` lights seven blocks rather than six. */
const SEGMENT_EPSILON = 1e-9;

/**
 * How many blocks a reading lights.
 *
 * Whole blocks only — a block is all or nothing, which is the point of drawing
 * blocks at all. **Any reading above the floor lights at least one**: rounding
 * down would leave the first quarter of a four-block meter dark, and "a little"
 * looking like "none" is the one reading a meter cannot afford to get wrong.
 */
export function litSegments({ ratio, count }: { ratio: number; count: number }): number {
	const clamped = clamp(ratio, 0, 1);
	if (clamped <= 0) return 0;
	const lit = Math.floor(clamped * count + SEGMENT_EPSILON);
	return lit < 1 ? 1 : lit > count ? count : lit;
}

/**
 * A settled reading, before any `valueLabel` — what a `valueLabel` function is
 * handed to word the reading, and its judgement, itself.
 */
export type MeterReading = {
	/** The reading, clamped to the scale. */
	value: number;
	minValue: number;
	maxValue: number;
	/** Where the reading sits on the scale, 0–1. */
	ratio: number;
	/** The reading, formatted by `formatOptions`. */
	formatted: string;
	/** The colour the reading was judged to be. */
	color: MeterColor;
	/** The region the reading falls in, when judged by `low`, `high` and `optimum`. */
	region: MeterRegion | null;
};

/** Words for the reading: fixed, or computed from it. */
export type MeterValueLabel = string | ((reading: MeterReading) => string);

/**
 * The text that replaces the formatted reading, on screen and to assistive
 * technology — or `undefined` to keep the formatted reading.
 *
 * **A function is how a judgement reaches a screen reader.** `Meter.Output` is
 * hidden from assistive technology because the root already speaks the value,
 * so words a readout function draws — "Filling up" — are seen and never heard.
 * The label is spoken, so computing it from the region says the judgement to
 * both at once.
 */
export function resolveMeterValueLabel(
	valueLabel: MeterValueLabel | undefined,
	reading: MeterReading
): string | undefined {
	return typeof valueLabel === "function" ? valueLabel(reading) : valueLabel;
}

/** What a meter was given at its own call site. */
export type MeterOwnAxes = {
	color?: MeterColor;
	size?: MeterSize;
};

/** Every axis settled. */
export type MeterAxes = Required<MeterOwnAxes>;

/**
 * Settles a meter's axes.
 *
 * One rung, deliberately: a meter reports a reading and accepts no input, so an
 * enclosing `Field` has no disabled or invalid state to hand it.
 */
export function resolveMeterAxes(own: MeterOwnAxes): MeterAxes {
	return {
		color: own.color ?? METER_DEFAULT_COLOR,
		size: own.size ?? METER_DEFAULT_SIZE,
	};
}

export type MeterVariantProps = VariantProps<typeof meterVariants>;
