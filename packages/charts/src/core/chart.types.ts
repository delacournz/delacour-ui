/**
 * Which axis the categories run along.
 *
 * `vertical` is the ordinary chart: categories along x, values up y.
 * `horizontal` swaps the roles so bars grow rightward from a category axis on
 * the left. It is decided once, at the root, because every mark, axis and the
 * scrub have to agree on it.
 */
export type ChartOrientation = "vertical" | "horizontal";

/**
 * One plotted datum, in both coordinate systems at once.
 *
 * Marks need the canvas coordinates; a tooltip, a label and the scrub state
 * need the domain values. Carrying both on one object is what stops a caller
 * having to re-invert a position to find out what it meant.
 */
export type ChartPoint = {
	/** Canvas x, in points. On a horizontal chart this is the value's position, `NaN` for a gap. */
	readonly x: number;
	/** Canvas y, in points. `null` marks a gap — the series has no value here. On a horizontal chart, the category's position. */
	readonly y: number | null;
	/** The datum's category in domain units — x on a vertical chart. Epoch milliseconds on a time scale. */
	readonly xValue: number;
	/** The datum's value in domain units — y on a vertical chart. `null` for a gap. */
	readonly yValue: number | null;
};

/**
 * One datum of a stacked series: a point with the edge it stands on.
 *
 * `y` and `yValue` are the segment's top — the running total including this
 * series — so a `ChartSegment` reads as a `ChartPoint` wherever a mark wants
 * only the upper edge. `y0` is where the series below it ended. Both are
 * `null` for a gap.
 */
export type ChartSegment = ChartPoint & {
	/**
	 * Canvas position of the segment's base **along the value axis** — a y on
	 * a vertical chart, an x on a horizontal one. Named for the vertical case,
	 * like `yValue`; the pair `y`/`y0` is what a bar draws between either way.
	 */
	readonly y0: number | null;
	/** The base in domain units. */
	readonly y0Value: number | null;
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
