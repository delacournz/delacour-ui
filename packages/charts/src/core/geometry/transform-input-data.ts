import type { ChartPoint, ChartRow } from "../chart.types";
import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { asNumber } from "../util/as-number";

export type TransformInputOptions = {
	readonly data: readonly ChartRow[];
	readonly yKeys: readonly string[];
	/** x in domain units, already resolved — see `resolveXValues`. */
	readonly xValues: readonly number[];
	readonly xScale: ScaleDescriptor;
	readonly yScale: ScaleDescriptor;
};

export type TransformedData = {
	/** One array per y key, in the order the keys were given. */
	readonly points: Readonly<Record<string, readonly ChartPoint[]>>;
	/** Canvas x per row, shared by every series — the scrub's search space. */
	readonly xPositions: readonly number[];
};

/**
 * Rows into plotted points, one series per y key.
 *
 * A row whose y field is missing, `null` or unparseable becomes a point with
 * `y: null` rather than being dropped. Dropping it would shift every later
 * point one place left against the x positions, and the line would silently
 * draw the wrong shape.
 */
export function transformInputData(options: TransformInputOptions): TransformedData {
	const { data, yKeys, xValues, xScale, yScale } = options;

	const xPositions = xValues.map((value) => scaleValue(xScale, value));
	const points: Record<string, ChartPoint[]> = {};

	for (const key of yKeys) {
		const series: ChartPoint[] = new Array(data.length);
		for (let index = 0; index < data.length; index += 1) {
			const yValue = asNumber((data[index] as ChartRow)[key]);
			const plottable = Number.isFinite(yValue);
			series[index] = {
				x: xPositions[index] as number,
				y: plottable ? scaleValue(yScale, yValue) : null,
				xValue: xValues[index] as number,
				yValue: plottable ? yValue : null,
			};
		}
		points[key] = series;
	}

	return { points, xPositions };
}

/** Every y value across every series, for measuring one shared domain. */
export function collectYValues(data: readonly ChartRow[], yKeys: readonly string[]): number[] {
	const values: number[] = [];
	for (const row of data) {
		for (const key of yKeys) {
			const value = asNumber(row[key]);
			if (Number.isFinite(value)) values.push(value);
		}
	}
	return values;
}
