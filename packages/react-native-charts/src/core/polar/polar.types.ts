/** A point on the canvas, in points. */
export type PolarPoint = {
	readonly x: number;
	readonly y: number;
};

/**
 * The hole in a donut — points, or a percentage of the outer radius.
 *
 * A percentage is the form a themed wrapper wants, because it reads the same
 * at every chart size; points are what a caller who has measured wants.
 */
export type InnerRadius = number | `${number}%`;

/** Where the circle sits on the canvas, and how big it is. */
export type PolarLayout = {
	readonly center: PolarPoint;
	readonly radius: number;
	readonly innerRadius: number;
};

/**
 * One slice, resolved: its share of the circle and where it is drawn.
 *
 * Angles are **degrees, 0° at 12 o'clock, clockwise** — the convention every
 * pie chart library on every platform shares, and the one a designer's
 * "start the first slice at the top" maps to without arithmetic. The layout
 * is carried on every slice so a mark can be handed one slice and draw it
 * with nothing else in scope.
 */
export type PieSliceData = {
	/** Position in the data, kept even for a slice with no sweep. */
	readonly index: number;
	readonly label: string;
	/** The datum's value; `0` for anything that could not be read. */
	readonly value: number;
	/** Share of the total, in `[0, 1]`. `0` when the total is zero. */
	readonly fraction: number;
	readonly startAngle: number;
	readonly endAngle: number;
	readonly sweepAngle: number;
	readonly center: PolarPoint;
	readonly radius: number;
	readonly innerRadius: number;
	/** The slice is the whole 360°, which makes its two edges coincide. */
	readonly sliceIsEntireCircle: boolean;
};
