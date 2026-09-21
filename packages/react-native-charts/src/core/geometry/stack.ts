import type { ChartOrientation, ChartRow, ChartSegment } from "../chart.types";
import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { asNumber } from "../util/as-number";

export type StackSeriesOptions = {
	readonly data: readonly ChartRow[];
	/** The keys to stack, bottom first. */
	readonly keys: readonly string[];
	readonly xValues: readonly number[];
	/** Canvas position of each row's category — on y when horizontal. */
	readonly xPositions: readonly number[];
	/** The value scale — on x when horizontal. */
	readonly yScale: ScaleDescriptor;
	readonly orientation?: ChartOrientation;
};

/**
 * Series stacked on one another, in data space, then scaled.
 *
 * Positives climb from zero and negatives descend from zero, each on its own
 * running total, so a row of `[3, -2, 1]` draws a bar of 4 above the axis and
 * a bar of 2 below it rather than a bar of 2 that has lost a series. Stacking
 * after scaling would get that wrong on a log axis and would add canvas
 * offsets that mean nothing.
 *
 * A null contributes nothing and comes out as a null segment, so the series
 * above it bases where the one below it ended — the gap is in one series, not
 * in the whole column.
 */
export function stackSeries(options: StackSeriesOptions): Record<string, readonly ChartSegment[]> {
	const { data, keys, xValues, xPositions, yScale, orientation = "vertical" } = options;
	const horizontal = orientation === "horizontal";
	const series: Record<string, ChartSegment[]> = {};
	for (const key of keys) series[key] = new Array(data.length);

	for (let index = 0; index < data.length; index += 1) {
		const row = data[index] as ChartRow;
		const x = xPositions[index] as number;
		const xValue = xValues[index] as number;
		let positive = 0;
		let negative = 0;

		for (const key of keys) {
			const value = asNumber(row[key]);
			const target = series[key] as ChartSegment[];
			if (!Number.isFinite(value)) {
				target[index] = segment(horizontal, x, xValue, null, null, Number.NaN, null);
				continue;
			}
			const base = value < 0 ? negative : positive;
			const top = base + value;
			if (value < 0) negative = top;
			else positive = top;
			target[index] = segment(horizontal, x, xValue, top, base, scaleStacked(yScale, top), scaleStacked(yScale, base));
		}
	}

	return series;
}

/** One segment, with its category and value positions on whichever canvas axes the orientation says. */
function segment(
	horizontal: boolean,
	category: number,
	xValue: number,
	yValue: number | null,
	y0Value: number | null,
	valuePosition: number,
	y0: number | null
): ChartSegment {
	if (horizontal) return { x: valuePosition, y: category, xValue, yValue, y0, y0Value };
	return { x: category, y: yValue === null ? null : valuePosition, xValue, yValue, y0, y0Value };
}

/**
 * A stacked edge through the scale, with zero pinned to the range floor on a
 * log axis. `scaleValue` maps a non-positive value on a log scale to a finite
 * but enormous negative position, which would put every bar's base far above
 * the canvas.
 */
function scaleStacked(scale: ScaleDescriptor, value: number): number {
	if (scale.kind === "log" && value <= 0) return scale.range[0];
	return scaleValue(scale, value);
}

/**
 * Every row's positive and negative running total, for measuring the y domain
 * a stack needs. The raw values are no use here — a domain that covers each
 * series covers none of their sums.
 */
export function collectStackedYValues(data: readonly ChartRow[], keys: readonly string[]): number[] {
	// No stack, no totals. A zero pair per row would pull zero into the y domain
	// of every chart, stacked or not, and a line of prices then starts at nothing.
	if (keys.length === 0) return [];
	const values: number[] = [];
	for (const row of data) {
		let positive = 0;
		let negative = 0;
		for (const key of keys) {
			const value = asNumber(row[key]);
			if (!Number.isFinite(value)) continue;
			if (value < 0) negative += value;
			else positive += value;
		}
		values.push(positive, negative);
	}
	return values;
}
