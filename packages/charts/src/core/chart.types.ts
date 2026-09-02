/**
 * One plotted datum, in both coordinate systems at once.
 *
 * Marks need the canvas coordinates; a tooltip, a label and the scrub state
 * need the domain values. Carrying both on one object is what stops a caller
 * having to re-invert a position to find out what it meant.
 */
export type ChartPoint = {
	/** Canvas x, in points. */
	readonly x: number;
	/** Canvas y, in points. `null` marks a gap — the series has no value here. */
	readonly y: number | null;
	/** The datum's x in domain units. Epoch milliseconds on a time scale. */
	readonly xValue: number;
	/** The datum's y in domain units, `null` for a gap. */
	readonly yValue: number | null;
};

/** The plot rect: the canvas minus the axis gutters and the padding. */
export type ChartBounds = {
	readonly left: number;
	readonly right: number;
	readonly top: number;
	readonly bottom: number;
};

export type ChartSize = {
	readonly width: number;
	readonly height: number;
};

/** A row of the caller's data. Fields are read by key, never by position. */
export type ChartRow = Record<string, unknown>;
