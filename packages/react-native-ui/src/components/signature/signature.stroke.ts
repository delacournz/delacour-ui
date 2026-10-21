import { isLiteralColor } from "../../lib/color";
import type { SignatureExportOptions, SignaturePoint, SignatureStroke, SignatureValue } from "./signature.types";

/**
 * The pure half of a signature: smoothing, the undo history, bounds, re-fitting
 * and SVG export.
 *
 * Free of React Native imports so a unit test reaches all of it. The smoother and
 * the point filter carry `"worklet"`, because the live stroke is rebuilt from
 * them on the UI thread on every move — the same function that draws the
 * finished path, so a stroke does not shift when it is committed.
 */

/** The ink's width in points when nobody names one. */
export const SIGNATURE_STROKE_WIDTH = 2.5;

/** How far a finger must travel before another point is sampled, in points. */
export const SIGNATURE_MIN_DISTANCE = 1.5;

/**
 * The ink an exported file is drawn in when nobody names one.
 *
 * Black rather than the pad's own colour: a file has no theme, and a
 * `foreground` that resolves to near-white in dark mode would export a
 * signature nobody can see on paper.
 */
export const SIGNATURE_EXPORT_STROKE_COLOR = "#000000";

/** Space kept around the ink by a `tight` export, in points. */
export const SIGNATURE_EXPORT_PADDING = 8;

/**
 * A coordinate as it is written into a path: two decimal places, no `-0`, and
 * zero for anything non-finite.
 *
 * Two places is well under a pixel at any density a phone ships and keeps a
 * long signature's path string short.
 */
function formatCoordinate(value: number): string {
	"worklet";
	if (!Number.isFinite(value)) return "0";
	const rounded = Math.round(value * 100) / 100;
	return String(rounded === 0 ? 0 : rounded);
}

/**
 * Whether a sampled point is far enough from the last one kept to be worth
 * adding.
 *
 * The first point of a stroke is always kept — it is what makes a tap a dot.
 * Distance is compared squared, so there is no square root per move.
 */
export function shouldAddPoint(last: SignaturePoint | undefined, next: SignaturePoint, minDistance: number): boolean {
	"worklet";
	if (last === undefined) return true;
	const dx = next.x - last.x;
	const dy = next.y - last.y;
	return dx * dx + dy * dy >= minDistance * minDistance;
}

/**
 * One stroke as an SVG path `d`.
 *
 * Three or more points become a chain of quadratic curves whose controls are the
 * sampled points and whose ends are the midpoints between them — the curve
 * passes near every point without overshooting any, so a fast stroke reads as
 * ink rather than as a polyline. Two points are a line, and one point is a
 * zero-length segment, which a round cap draws as a dot.
 *
 * A worklet: the live stroke calls this on the UI thread on every move.
 */
export function smoothStroke(points: SignatureStroke): string {
	"worklet";
	const count = points.length;
	if (count === 0) return "";

	const first = points[0] as SignaturePoint;
	const start = `M${formatCoordinate(first.x)} ${formatCoordinate(first.y)}`;
	if (count === 1) return `${start} L${formatCoordinate(first.x)} ${formatCoordinate(first.y)}`;

	const last = points[count - 1] as SignaturePoint;
	const end = ` L${formatCoordinate(last.x)} ${formatCoordinate(last.y)}`;
	if (count === 2) return `${start}${end}`;

	let path = start;
	for (let index = 1; index < count - 1; index++) {
		const control = points[index] as SignaturePoint;
		const next = points[index + 1] as SignaturePoint;
		const midX = (control.x + next.x) / 2;
		const midY = (control.y + next.y) / 2;
		path += ` Q${formatCoordinate(control.x)} ${formatCoordinate(control.y)} ${formatCoordinate(midX)} ${formatCoordinate(midY)}`;
	}
	return `${path}${end}`;
}

/**
 * What {@link traceStroke} draws into — the three path verbs it uses. A Skia
 * `SkPathBuilder` is one; so is anything that records the calls.
 */
export type SignaturePathSink = {
	moveTo: (x: number, y: number) => unknown;
	lineTo: (x: number, y: number) => unknown;
	quadTo: (x1: number, y1: number, x2: number, y2: number) => unknown;
};

/**
 * One stroke drawn straight into a path, verb by verb — the curve
 * {@link smoothStroke} writes, without a string to build and parse back.
 *
 * Coordinates go in unrounded, so the live stroke and its committed copy, both
 * traced here, match to the bit; a non-finite one is traced as zero, as the
 * string form writes it. Self-contained, with no helper of this module's: a
 * module-scope function called from a worklet can be missing from its closure on
 * the UI thread.
 *
 * A worklet: the live stroke calls this on the UI thread on every move.
 */
export function traceStroke(points: SignatureStroke, sink: SignaturePathSink): void {
	"worklet";
	const count = points.length;
	if (count === 0) return;

	const first = points[0] as SignaturePoint;
	const firstX = Number.isFinite(first.x) ? first.x : 0;
	const firstY = Number.isFinite(first.y) ? first.y : 0;
	sink.moveTo(firstX, firstY);
	if (count === 1) {
		sink.lineTo(firstX, firstY);
		return;
	}

	for (let index = 1; index < count - 1; index++) {
		const control = points[index] as SignaturePoint;
		const next = points[index + 1] as SignaturePoint;
		const controlX = Number.isFinite(control.x) ? control.x : 0;
		const controlY = Number.isFinite(control.y) ? control.y : 0;
		const midX = (control.x + next.x) / 2;
		const midY = (control.y + next.y) / 2;
		sink.quadTo(controlX, controlY, Number.isFinite(midX) ? midX : 0, Number.isFinite(midY) ? midY : 0);
	}

	const last = points[count - 1] as SignaturePoint;
	sink.lineTo(Number.isFinite(last.x) ? last.x : 0, Number.isFinite(last.y) ? last.y : 0);
}

/** One smoothed path per stroke, in order. */
export function strokesToPaths(strokes: readonly SignatureStroke[]): readonly string[] {
	return strokes.map((stroke) => smoothStroke(stroke));
}

/**
 * Everything the pad knows about its drawing.
 *
 * `width` and `height` are the coordinate space the strokes are in — the pad's
 * measured size, or a seeded value's own size until the pad measures. `current`
 * is a stroke under construction through `begin` / `append` / `end`; the pad
 * itself draws on the UI thread and hands over a whole stroke with `commit`.
 */
export type SignatureHistory = {
	width: number;
	height: number;
	strokes: readonly SignatureStroke[];
	redo: readonly SignatureStroke[];
	current: readonly SignaturePoint[] | null;
};

/** Everything that can happen to a history. */
export type SignatureHistoryAction =
	| { type: "begin"; point: SignaturePoint }
	| { type: "append"; point: SignaturePoint }
	| { type: "end" }
	| { type: "commit"; stroke: SignatureStroke }
	| { type: "undo" }
	| { type: "redo" }
	| { type: "clear" }
	| { type: "layout"; width: number; height: number }
	| { type: "reset"; value: SignatureValue | null };

const NO_STROKES: readonly SignatureStroke[] = [];

/** A history seeded from a value, or an empty one. */
export function createHistory(value: SignatureValue | null): SignatureHistory {
	return {
		width: value?.width ?? 0,
		height: value?.height ?? 0,
		strokes: value?.strokes ?? NO_STROKES,
		redo: NO_STROKES,
		current: null,
	};
}

/** Adds a finished stroke. Any new stroke discards what was undone. */
function withStroke(state: SignatureHistory, stroke: SignatureStroke): SignatureHistory {
	if (stroke.length === 0) return state;
	return { ...state, strokes: [...state.strokes, stroke], redo: NO_STROKES, current: null };
}

/** Re-fits the strokes and the redo stack to a newly measured pad. */
function withLayout(state: SignatureHistory, width: number, height: number): SignatureHistory {
	if (width <= 0 || height <= 0) return state;
	if (width === state.width && height === state.height) return state;
	if (state.width <= 0 || state.height <= 0) return { ...state, width, height };
	const fit = (strokes: readonly SignatureStroke[]) =>
		strokes.length === 0
			? strokes
			: scaleValue({ width: state.width, height: state.height, strokes }, width, height).strokes;
	return { ...state, width, height, strokes: fit(state.strokes), redo: fit(state.redo) };
}

/** Replaces the drawing and drops its history, fitted to the pad when it has been measured. */
function withValue(state: SignatureHistory, value: SignatureValue | null): SignatureHistory {
	if (value === null) return { ...state, strokes: NO_STROKES, redo: NO_STROKES, current: null };
	if (state.width <= 0 || state.height <= 0) return { ...createHistory(value) };
	const fitted = scaleValue(value, state.width, state.height);
	return { ...state, strokes: fitted.strokes, redo: NO_STROKES, current: null };
}

/**
 * The undo history as a reducer.
 *
 * Every action that has nothing to do returns the **same reference**, so a
 * caller can tell a real change from a no-op with `===` and skip both the render
 * and the `onValueChange`.
 *
 * `clear` is final: it empties the redo stack too and cannot be undone. A clear
 * that undo could reverse is a clear that has to be explained, and the button
 * says "Clear signature".
 */
export function historyReducer(state: SignatureHistory, action: SignatureHistoryAction): SignatureHistory {
	switch (action.type) {
		case "begin":
			return { ...state, current: [action.point] };
		case "append":
			if (state.current === null) return state;
			return { ...state, current: [...state.current, action.point] };
		case "end":
			if (state.current === null) return state;
			return withStroke(state, state.current);
		case "commit":
			return withStroke(state, action.stroke);
		case "undo": {
			const last = state.strokes[state.strokes.length - 1];
			if (last === undefined) return state;
			return { ...state, strokes: state.strokes.slice(0, -1), redo: [...state.redo, last] };
		}
		case "redo": {
			const last = state.redo[state.redo.length - 1];
			if (last === undefined) return state;
			return { ...state, strokes: [...state.strokes, last], redo: state.redo.slice(0, -1) };
		}
		case "clear":
			if (state.strokes.length === 0 && state.redo.length === 0) return state;
			return { ...state, strokes: NO_STROKES, redo: NO_STROKES, current: null };
		case "layout":
			return withLayout(state, action.width, action.height);
		case "reset":
			return withValue(state, action.value);
	}
}

/** Whether the pad holds no finished stroke. A stroke still being drawn does not count. */
export function isHistoryEmpty(state: SignatureHistory): boolean {
	return state.strokes.length === 0;
}

/** How many finished strokes the pad holds. */
export function strokeCount(state: SignatureHistory): number {
	return state.strokes.length;
}

export function canUndo(state: SignatureHistory): boolean {
	return state.strokes.length > 0;
}

export function canRedo(state: SignatureHistory): boolean {
	return state.redo.length > 0;
}

/** The history as a value, or `null` while it is empty — the shape `onValueChange` reports. */
export function historyToValue(state: SignatureHistory): SignatureValue | null {
	if (state.strokes.length === 0) return null;
	return { width: state.width, height: state.height, strokes: state.strokes };
}

/** A box in pad coordinates. */
export type SignatureBounds = { x: number; y: number; width: number; height: number };

/**
 * The box the ink covers, or `null` with no ink.
 *
 * Inflated by half the stroke width on every side, because a point is the
 * centre of the pen, not its edge — a crop to the bare points would shave the
 * outer half of every stroke off.
 */
export function boundsOf(strokes: readonly SignatureStroke[], strokeWidth: number): SignatureBounds | null {
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const stroke of strokes) {
		for (const point of stroke) {
			minX = Math.min(minX, point.x);
			minY = Math.min(minY, point.y);
			maxX = Math.max(maxX, point.x);
			maxY = Math.max(maxY, point.y);
		}
	}
	if (!Number.isFinite(minX)) return null;

	const half = strokeWidth / 2;
	return { x: minX - half, y: minY - half, width: maxX - minX + strokeWidth, height: maxY - minY + strokeWidth };
}

/**
 * A value re-fitted to a pad of another size.
 *
 * Scaled uniformly — a signature squashed to a new aspect is a different
 * signature — and centred on the axis with room to spare. Returns the same
 * reference when nothing changes, and when either size is unmeasured, since
 * there is nothing to scale from or to.
 */
export function scaleValue(value: SignatureValue, width: number, height: number): SignatureValue {
	if (value.width <= 0 || value.height <= 0 || width <= 0 || height <= 0) return value;
	if (value.width === width && value.height === height) return value;

	const scale = Math.min(width / value.width, height / value.height);
	const offsetX = (width - value.width * scale) / 2;
	const offsetY = (height - value.height * scale) / 2;

	return {
		width,
		height,
		strokes: value.strokes.map((stroke) =>
			stroke.map((point) => {
				const moved: SignaturePoint = { x: point.x * scale + offsetX, y: point.y * scale + offsetY };
				return point.t === undefined ? moved : { ...moved, t: point.t };
			})
		),
	};
}

/** Escapes a string for a double-quoted XML attribute. */
function escapeAttribute(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** A number as it is written into an attribute: the same rounding as a path. */
function formatNumber(value: number): string {
	return formatCoordinate(value);
}

/** What an export draws, with every option resolved: the same for `toSVG` and `toPNG`. */
export type SignatureExport = {
	/** The frame, in pad coordinates. */
	box: SignatureBounds;
	strokeColor: string;
	strokeWidth: number;
	/** A literal colour, or `null` for none. */
	background: string | null;
};

/**
 * An export's options resolved against a value.
 *
 * One function so the SVG and the PNG frame and colour a signature identically:
 * `viewBox: "pad"` keeps the whole pad, `"tight"` crops to the ink plus
 * `padding` and falls back to the pad with no ink; a token name or
 * `transparent` is no colour.
 */
export function resolveSignatureExport(value: SignatureValue, options: SignatureExportOptions = {}): SignatureExport {
	const strokeWidth = options.strokeWidth ?? SIGNATURE_STROKE_WIDTH;
	const strokeColor =
		options.strokeColor !== undefined && isLiteralColor(options.strokeColor)
			? options.strokeColor
			: SIGNATURE_EXPORT_STROKE_COLOR;
	const background = options.background !== undefined && isLiteralColor(options.background) ? options.background : null;

	const bounds = options.viewBox === "tight" ? boundsOf(value.strokes, strokeWidth) : null;
	const padding = options.padding ?? SIGNATURE_EXPORT_PADDING;
	const box: SignatureBounds = bounds
		? {
				x: bounds.x - padding,
				y: bounds.y - padding,
				width: bounds.width + padding * 2,
				height: bounds.height + padding * 2,
			}
		: { x: 0, y: 0, width: value.width, height: value.height };

	return { background, box, strokeColor, strokeWidth };
}

/**
 * A PNG's size in whole pixels: the box times `scale`, rounded. `null` when that
 * is no pixels at all — an unmeasured pad, or a scale that is not positive.
 */
export function signaturePngSize(box: SignatureBounds, scale: number): { width: number; height: number } | null {
	if (!(Number.isFinite(scale) && scale > 0)) return null;
	const width = Math.round(box.width * scale);
	const height = Math.round(box.height * scale);
	if (!(width > 0 && height > 0)) return null;
	return { width, height };
}

/**
 * The signature as a standalone SVG document.
 *
 * One `<path>` per stroke, unfilled, with round caps and joins — the same
 * geometry the pad draws, so the file opens looking like what was signed.
 * `viewBox: "pad"` keeps the whole pad; `"tight"` crops to the ink plus
 * `padding`, and falls back to the pad when there is no ink to crop to.
 *
 * Colours must be literal. A token name is ignored — the ink falls back to
 * {@link SIGNATURE_EXPORT_STROKE_COLOR} and the background to none — because a
 * file has no theme to resolve one against. Every attribute is escaped.
 */
export function toSVG(value: SignatureValue, options: SignatureExportOptions = {}): string {
	const { background, box, strokeColor, strokeWidth } = resolveSignatureExport(value, options);

	const x = formatNumber(box.x);
	const y = formatNumber(box.y);
	const width = formatNumber(box.width);
	const height = formatNumber(box.height);

	const rect = background
		? `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escapeAttribute(background)}"/>`
		: "";
	const stroke = escapeAttribute(strokeColor);
	const paths = strokesToPaths(value.strokes)
		.map(
			(d) =>
				`<path fill="none" stroke="${stroke}" stroke-width="${formatNumber(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`
		)
		.join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}">${rect}${paths}</svg>`;
}

/** A value as JSON, for storage. */
export function serializeSignature(value: SignatureValue): string {
	return JSON.stringify(value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function isPoint(value: unknown): value is SignaturePoint {
	if (typeof value !== "object" || value === null) return false;
	const point = value as Record<string, unknown>;
	return isFiniteNumber(point.x) && isFiniteNumber(point.y) && (point.t === undefined || isFiniteNumber(point.t));
}

/**
 * Whether something read back from storage is a value a pad can draw.
 *
 * Strict on purpose: a stored signature is user data from an older build or
 * another device, and a half-valid one would draw as a scribble nobody signed.
 */
export function isSignatureValue(value: unknown): value is SignatureValue {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const candidate = value as Record<string, unknown>;
	if (!isFiniteNumber(candidate.width) || !isFiniteNumber(candidate.height)) return false;
	if (candidate.width < 0 || candidate.height < 0) return false;
	if (!Array.isArray(candidate.strokes)) return false;
	return candidate.strokes.every((stroke) => Array.isArray(stroke) && stroke.every(isPoint));
}

/** A value read back from {@link serializeSignature}, or `null` for anything malformed. */
export function parseSignature(text: string): SignatureValue | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return null;
	}
	return isSignatureValue(parsed) ? parsed : null;
}
