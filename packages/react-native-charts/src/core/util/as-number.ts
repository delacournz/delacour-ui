/**
 * A value as a number, or `NaN` when it is not one.
 *
 * A chart's x field is routinely a `Date` or a string label rather than a
 * number. A `Date` is its epoch milliseconds; a numeric string is that number;
 * anything else is `NaN`, and the caller substitutes the datum's index.
 *
 * It returns `NaN` rather than throwing on purpose. One unparseable row in a
 * thousand should leave a gap in the line, not blank the whole chart.
 */
export function asNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (value instanceof Date) return value.getTime();
	if (typeof value === "string" && value.trim() !== "") return Number(value);
	if (typeof value === "boolean") return value ? 1 : 0;
	return Number.NaN;
}

/** Whether a value can be drawn — finite, and not the `null` that marks a gap. */
export function isPlottable(value: number | null | undefined): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
