import type { ChartRow } from "../chart.types";
import { asNumber } from "../util/as-number";

export type ResolvedXValues = {
	readonly values: readonly number[];
	/**
	 * Whether the values are positions rather than measurements.
	 *
	 * True when the field held labels and the index stood in for it. An axis
	 * should then print the original label, never the number.
	 */
	readonly isCategorical: boolean;
	/** The original field values, for a label formatter. */
	readonly raw: readonly unknown[];
};

/**
 * The x values a scale can be built from.
 *
 * A chart's x field is often a month name or a category. When *any* row fails
 * to read as a number the whole series falls back to indices — all of it, not
 * just the bad rows. Mixing the two would break the ascending order every
 * binary search in this package assumes, and a scrub would land on the wrong
 * datum in a way that looks like a rendering bug.
 */
export function resolveXValues(data: readonly ChartRow[], xKey: string): ResolvedXValues {
	const raw = data.map((row) => row[xKey]);
	const numeric = raw.map(asNumber);
	const isCategorical = numeric.some((value) => !Number.isFinite(value));

	return {
		values: isCategorical ? raw.map((_, index) => index) : numeric,
		isCategorical,
		raw,
	};
}
