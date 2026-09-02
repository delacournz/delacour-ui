import type { ChartOrientation, ChartPoint, ChartRow } from "../chart.types";
import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { asNumber } from "../util/as-number";

export type TransformInputOptions = {
	readonly data: readonly ChartRow[];
	readonly yKeys: readonly string[];
	/** x in domain units, already resolved — see `resolveXValues`. */
	readonly xValues: readonly number[];
	/** The scale on the canvas' x axis — categories when vertical, values when horizontal. */
	readonly xScale: ScaleDescriptor;
	/** The scale on the canvas' y axis. */
	readonly yScale: ScaleDescriptor;
	/** Defaults to `vertical`. */
	readonly orientation?: ChartOrientation;
};

export type TransformedData = {
	/** One array per y key, in the order the keys were given. */
	readonly points: Readonly<Record<string, readonly ChartPoint[]>>;
	/**
	 * Canvas position of each row's category, shared by every series — the
	 * scrub's search space. An x on a vertical chart, a y on a horizontal one;
	 * the name is the vertical case, like `xValue`.
	 */
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
	const { data, yKeys, xValues, xScale, yScale, orientation = "vertical" } = options;
	const horizontal = orientation === "horizontal";
	const categoryScale = horizontal ? yScale : xScale;
	const valueScale = horizontal ? xScale : yScale;

	const xPositions = xValues.map((value) => scaleValue(categoryScale, value));
	const points: Record<string, ChartPoint[]> = {};

	for (const key of yKeys) {
		const series: ChartPoint[] = new Array(data.length);
		for (let index = 0; index < data.length; index += 1) {
			const yValue = asNumber((data[index] as ChartRow)[key]);
			const plottable = Number.isFinite(yValue);
			series[index] = plotPoint(
				horizontal,
				xPositions[index] as number,
				xValues[index] as number,
				plottable ? yValue : null,
				plottable ? scaleValue(valueScale, yValue) : null
			);
		}
		points[key] = series;
	}

	return { points, xPositions };
}

/** One point, its category and value positions on whichever canvas axes the orientation says. */
function plotPoint(
	horizontal: boolean,
	category: number,
	xValue: number,
	yValue: number | null,
	valuePosition: number | null
): ChartPoint {
	if (horizontal) return { x: valuePosition ?? Number.NaN, y: category, xValue, yValue };
	return { x: category, y: valuePosition, xValue, yValue };
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
