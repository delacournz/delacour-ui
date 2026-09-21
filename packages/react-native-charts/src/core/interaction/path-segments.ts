/**
 * One contiguous run of cubic segments.
 *
 * Flat numbers, `[x0,y0, c1x,c1y,c2x,c2y,x1,y1, c1x,c1y,c2x,c2y,x2,y2, …]` —
 * two for the start point, then six per segment. Segment `i` starts where
 * segment `i-1` ended, so the array is `2 + 6n` long.
 *
 * Flat because it crosses into a shared value and is read every frame of a
 * scrub. Two hundred `{x, y}` objects is two hundred serialisations where a
 * number array is one.
 */
export type CurveRun = readonly number[];

/** A whole path: one run per subpath. A series with gaps has more than one. */
export type CurvePath = readonly CurveRun[];

/** Numbers per segment after the leading start point. */
export const RUN_STRIDE = 6;

/** How many cubic segments a run holds. */
export function runSegmentCount(run: CurveRun): number {
	return run.length < 2 + RUN_STRIDE ? 0 : (run.length - 2) / RUN_STRIDE;
}

/** Path verbs, their operands, and the pen position between them. */
type Builder = {
	readonly runs: number[][];
	run: number[] | null;
	x: number;
	y: number;
};

const TOKEN = /([MLCZmlczHhVv])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
const THIRD = 1 / 3;

/** Appends a cubic, opening a run if the pen has just moved. */
function cubicTo(builder: Builder, c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
	if (builder.run === null) {
		builder.run = [builder.x, builder.y];
		builder.runs.push(builder.run);
	}
	builder.run.push(c1x, c1y, c2x, c2y, x, y);
	builder.x = x;
	builder.y = y;
}

/**
 * Appends a straight segment **as a cubic**, control points at the third and
 * two-third marks — the same line, in the one shape the solver understands.
 */
function lineTo(builder: Builder, x: number, y: number): void {
	const dx = x - builder.x;
	const dy = y - builder.y;
	cubicTo(
		builder,
		builder.x + dx * THIRD,
		builder.y + dy * THIRD,
		builder.x + dx * 2 * THIRD,
		builder.y + dy * 2 * THIRD,
		x,
		y
	);
}

function moveTo(builder: Builder, values: readonly number[]): void {
	if (values.length < 2) return;
	builder.x = values[0] as number;
	builder.y = values[1] as number;
	builder.run = null;
	for (let index = 2; index + 1 < values.length; index += 2) {
		lineTo(builder, values[index] as number, values[index + 1] as number);
	}
}

function curveTo(builder: Builder, values: readonly number[]): void {
	for (let index = 0; index + 5 < values.length; index += RUN_STRIDE) {
		cubicTo(
			builder,
			values[index] as number,
			values[index + 1] as number,
			values[index + 2] as number,
			values[index + 3] as number,
			values[index + 4] as number,
			values[index + 5] as number
		);
	}
}

function applyVerb(builder: Builder, verb: string, values: readonly number[]): void {
	switch (verb) {
		case "M":
			moveTo(builder, values);
			return;
		case "C":
			curveTo(builder, values);
			return;
		case "L":
			for (let index = 0; index + 1 < values.length; index += 2) {
				lineTo(builder, values[index] as number, values[index + 1] as number);
			}
			return;
		case "H":
			for (const value of values) lineTo(builder, value, builder.y);
			return;
		case "V":
			for (const value of values) lineTo(builder, builder.x, value);
			return;
		default:
			return;
	}
}

/**
 * Re-encodes an SVG path string as runs of cubics.
 *
 * Two jobs, and the second is the interesting one.
 *
 * It **normalises every segment to a cubic**, so the scrub solver has exactly
 * one segment kind to handle however the curve was drawn — no branch on verb,
 * no second code path to get wrong. d3 emits `L` for a linear curve and `C`
 * for a monotone one; downstream, they are indistinguishable.
 *
 * And it **splits on subpath**, so a series broken by a gap yields one run per
 * unbroken stretch and the solver reports no value inside the gap rather than
 * interpolating a line nobody measured.
 *
 * Only the verbs d3's `line` and `area` emit are handled — `M`, `L`, `C`, `Z`,
 * plus `H`/`V` defensively. Anything else is ignored rather than throwing: a
 * path this cannot fully read should cost a scrub, not the whole chart.
 */
export function toCurvePath(path: string): CurvePath {
	if (path === "") return [];

	const builder: Builder = { runs: [], run: null, x: 0, y: 0 };
	let verb = "";
	let operands: number[] = [];

	TOKEN.lastIndex = 0;
	for (let match = TOKEN.exec(path); match !== null; match = TOKEN.exec(path)) {
		if (match[1] === undefined) {
			operands.push(Number(match[2]));
			continue;
		}
		if (verb !== "") applyVerb(builder, verb, operands);
		operands = [];
		verb = match[1].toUpperCase();
		if (verb === "Z") {
			verb = "";
			builder.run = null;
		}
	}
	if (verb !== "") applyVerb(builder, verb, operands);

	return builder.runs.filter((run) => run.length >= 2 + RUN_STRIDE);
}
