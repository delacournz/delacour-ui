import type { ChartRow } from "../chart.types";
import { asNumber } from "../util/as-number";

export type PieInput = {
	/** One per row, `NaN` where the field could not be read. */
	readonly values: readonly number[];
	/** One per row, the index when there is no label field. */
	readonly labels: readonly string[];
};

/**
 * The value and label of every row, by key.
 *
 * Nothing is dropped here. A row that cannot be read stays in place as `NaN`
 * so that indices still line up with the caller's data — `resolveSlices` turns
 * it into a zero-sweep slice, and a tap readout reporting index 3 means the
 * fourth row and not the fourth *readable* row.
 */
export function collectPieInput(rows: readonly ChartRow[], valueKey: string, labelKey?: string): PieInput {
	const values: number[] = [];
	const labels: string[] = [];
	rows.forEach((row, index) => {
		values.push(asNumber(row[valueKey]));
		if (labelKey === undefined) {
			labels.push(String(index));
			return;
		}
		const label = row[labelKey];
		labels.push(label === null || label === undefined ? "" : String(label));
	});
	return { values, labels };
}
