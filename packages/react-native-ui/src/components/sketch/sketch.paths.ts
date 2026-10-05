/**
 * The maths under a drawing surface: smoothing a touch path into SVG path data,
 * the eight shapes, the eraser's mask groups and the SVG export.
 *
 * **A leaf that imports nothing.** Not React, not React Native, not Reanimated,
 * not `react-native-svg` — not even a sibling. A freehand signature is the same
 * stroke pipeline with fixed ink, and it should take this file rather than fork
 * it; anything imported here would be a dependency of every such reuse.
 * `sketch.paths.test.ts` asserts the file has no `import` at all.
 *
 * **Strings, not points.** A stroke is built as a path string, one segment
 * appended per touch sample, because the live stroke is drawn from a string on
 * the UI thread and the export needs a string too. Keeping points would mean an
 * array copy per sample and a join per frame.
 *
 * The functions the gesture calls are marked `"worklet"` and are still plain
 * functions to `bun test`. They read no module-scope binding but each other, and
 * every number they need is inlined — see AGENTS.md on worklet capture.
 */

/** The three tools a sketch draws with. */
export const SKETCH_TOOLS = ["pen", "shape", "eraser"] as const;

/** The shapes the shape tool draws, in toolbar order. */
export const SKETCH_SHAPES = ["rectangle", "ellipse", "triangle", "diamond", "line", "arrow", "star", "heart"] as const;

export type SketchTool = (typeof SKETCH_TOOLS)[number];
export type SketchShape = (typeof SKETCH_SHAPES)[number];

export type SketchPoint = { x: number; y: number };

/**
 * One committed mark. Geometry is stored as SVG path data, not as points: the live stroke is
 * built as a string on the UI thread, and a string is what `toSVG` needs. Colour is a resolved
 * literal, so the export is theme-independent.
 */
export type SketchItem =
	| { id: string; kind: "stroke"; d: string; color: string; width: number }
	| { id: string; kind: "shape"; shape: SketchShape; d: string; color: string; width: number }
	| { id: string; kind: "erase"; d: string; width: number };

/** A mark that paints ink — everything but an eraser. */
export type SketchMark = Exclude<SketchItem, { kind: "erase" }>;

/** An eraser's stroke. */
export type SketchEraser = Extract<SketchItem, { kind: "erase" }>;

/** A drag shorter than this on both axes, in points, is a tap and draws no shape. */
export const SKETCH_MIN_SHAPE_DRAG = 4;

/** A touch sample closer than this to the last, in points, adds nothing to a stroke. */
export const SKETCH_MIN_SEGMENT = 0.5;

/**
 * A number as path data: two decimal places, trailing zeros trimmed.
 *
 * Two places is a hundredth of a point — finer than any screen draws, and short
 * enough that a long stroke stays a reasonable string. `-0`, `NaN` and the
 * infinities all write as `0`, so a degenerate sample can never put `NaN` into
 * a path a renderer then refuses to draw.
 */
export function formatSketchNumber(n: number): string {
	"worklet";
	if (!Number.isFinite(n)) return "0";
	const rounded = Math.round(n * 100) / 100;
	if (rounded === 0) return "0";
	return String(rounded);
}

/** The stroke being drawn: its path so far, the last sample, and the midpoint the path ends on. */
export type SketchPathState = {
	d: string;
	last: SketchPoint;
	mid: SketchPoint;
	/** How many samples the path holds. One is a tap. */
	count: number;
};

/** A stroke begun at the first touch. */
export function startSketchPath(p: SketchPoint): SketchPathState {
	"worklet";
	return { count: 1, d: `M${formatSketchNumber(p.x)} ${formatSketchNumber(p.y)}`, last: p, mid: p };
}

/**
 * Adds one touch sample to a stroke, as a quadratic segment.
 *
 * The control point is the previous sample and the end point is the midpoint
 * between it and this one — the classic midpoint smoother, which turns a
 * polyline of touch samples into a curve with continuous tangents. It is O(1)
 * per sample: a string append, no array.
 *
 * A sample under half a point from the last returns the same state, so a
 * resting finger does not grow the path.
 */
export function appendSketchSegment(state: SketchPathState, p: SketchPoint): SketchPathState {
	"worklet";
	const dx = p.x - state.last.x;
	const dy = p.y - state.last.y;
	if (dx * dx + dy * dy < 0.25) return state;

	const mid = { x: (state.last.x + p.x) / 2, y: (state.last.y + p.y) / 2 };
	const d = `${state.d} Q${formatSketchNumber(state.last.x)} ${formatSketchNumber(state.last.y)} ${formatSketchNumber(mid.x)} ${formatSketchNumber(mid.y)}`;
	return { count: state.count + 1, d, last: p, mid };
}

/**
 * The path a stroke commits as.
 *
 * A tap is a hundredth-of-a-point line, which a round cap draws as a dot the
 * width of the pen. A drag closes with a straight line from the last midpoint to
 * the last sample, so the stroke ends under the finger rather than half a
 * sample short of it.
 */
export function finishSketchPath(state: SketchPathState): string {
	"worklet";
	if (state.count <= 1) {
		return `${state.d} L${formatSketchNumber(state.last.x + 0.01)} ${formatSketchNumber(state.last.y)}`;
	}
	return `${state.d} L${formatSketchNumber(state.last.x)} ${formatSketchNumber(state.last.y)}`;
}

/**
 * One shape's path, from where the drag began to where it is now.
 *
 * Every shape but `line` and `arrow` is drawn in the drag's normalised bounds,
 * so dragging up and left draws the same rectangle as dragging down and right.
 * A line and an arrow follow the drag, because their direction is the point.
 *
 * `null` for a drag under four points on both axes: a tap with a shape tool is
 * not a shape. `width` is the stroke width, and sizes the arrow's barbs.
 */
export function buildSketchShapePath(shape: SketchShape, from: SketchPoint, to: SketchPoint, width = 4): string | null {
	"worklet";
	const f = formatSketchNumber;
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return null;

	const x0 = Math.min(from.x, to.x);
	const y0 = Math.min(from.y, to.y);
	const x1 = Math.max(from.x, to.x);
	const y1 = Math.max(from.y, to.y);
	const w = x1 - x0;
	const h = y1 - y0;
	const cx = x0 + w / 2;
	const cy = y0 + h / 2;

	switch (shape) {
		case "rectangle":
			return `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`;
		case "ellipse": {
			const arc = `A${f(w / 2)} ${f(h / 2)} 0 1 0`;
			return `M${f(x0)} ${f(cy)}${arc} ${f(x1)} ${f(cy)}${arc} ${f(x0)} ${f(cy)}Z`;
		}
		case "triangle":
			return `M${f(cx)} ${f(y0)}L${f(x1)} ${f(y1)}L${f(x0)} ${f(y1)}Z`;
		case "diamond":
			return `M${f(cx)} ${f(y0)}L${f(x1)} ${f(cy)}L${f(cx)} ${f(y1)}L${f(x0)} ${f(cy)}Z`;
		case "line":
			return `M${f(from.x)} ${f(from.y)}L${f(to.x)} ${f(to.y)}`;
		case "arrow": {
			const length = Math.hypot(dx, dy);
			const barb = Math.min(Math.max(width * 4, 8), length * 0.4);
			const angle = Math.atan2(dy, dx);
			const spread = (25 * Math.PI) / 180;
			const a1 = angle + Math.PI + spread;
			const a2 = angle + Math.PI - spread;
			const b1x = to.x + barb * Math.cos(a1);
			const b1y = to.y + barb * Math.sin(a1);
			const b2x = to.x + barb * Math.cos(a2);
			const b2y = to.y + barb * Math.sin(a2);
			return `M${f(from.x)} ${f(from.y)}L${f(to.x)} ${f(to.y)}M${f(b1x)} ${f(b1y)}L${f(to.x)} ${f(to.y)}L${f(b2x)} ${f(b2y)}`;
		}
		case "star": {
			let d = "";
			for (let index = 0; index < 10; index++) {
				const scale = index % 2 === 0 ? 1 : 0.5;
				const theta = -Math.PI / 2 + (index * Math.PI) / 5;
				const x = cx + (w / 2) * scale * Math.cos(theta);
				const y = cy + (h / 2) * scale * Math.sin(theta);
				d += `${index === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
			}
			return `${d}Z`;
		}
		case "heart": {
			const px = (u: number) => f(x0 + u * w);
			const py = (v: number) => f(y0 + v * h);
			return (
				`M${px(0.5)} ${py(1)}` +
				`C${px(0.5)} ${py(1)} ${px(0)} ${py(0.65)} ${px(0)} ${py(0.3)}` +
				`C${px(0)} ${py(0)} ${px(0.45)} ${py(0)} ${px(0.5)} ${py(0.25)}` +
				`C${px(0.55)} ${py(0)} ${px(1)} ${py(0)} ${px(1)} ${py(0.3)}` +
				`C${px(1)} ${py(0.65)} ${px(0.5)} ${py(1)} ${px(0.5)} ${py(1)}Z`
			);
		}
		default:
			return null;
	}
}

const SAFE_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const SAFE_FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([\w\s.,%/+-]*\)$/i;
const SAFE_KEYWORD = /^[a-z]+$/i;
const SAFE_PATH = /^[MLHVCSQTAZmlhvcsqtaz\d\s.,eE+-]*$/;

/**
 * True for a colour that can be written into an SVG attribute as-is.
 *
 * A hex, a colour function or a bare keyword, and nothing else. `toSVG` writes
 * a caller's colours into markup, and an item can come from anywhere — a stored
 * drawing, a server — so a value like `red" onload="…` must never reach the
 * string. `url(…)` is refused too: it is a paint server reference, not a colour.
 */
export function isSafeSketchColor(color: string): boolean {
	return SAFE_HEX.test(color) || SAFE_FUNCTION.test(color) || SAFE_KEYWORD.test(color);
}

/** True for path data made only of path commands and numbers. Same reason as {@link isSafeSketchColor}. */
export function isSafeSketchPathData(d: string): boolean {
	return SAFE_PATH.test(d);
}

/** A run of ink marks, and the erasers drawn after it that mask it. */
export type SketchGroup = {
	marks: SketchMark[];
	erasers: SketchEraser[];
};

/**
 * Splits a drawing into the runs of ink between erasers.
 *
 * An eraser removes the ink under it **that was there before it**: a stroke
 * drawn afterwards over the same spot is untouched. So each run of marks is
 * masked by every eraser that comes after it, and by none before. Erasing is a
 * mask, not geometry deletion — nothing is cut out of a path.
 *
 * Leading erasers mask nothing and make no group, and adjacent erasers land
 * once each in the group before them.
 */
export function groupSketchItems(items: readonly SketchItem[]): SketchGroup[] {
	const groups: SketchGroup[] = [];
	let current: SketchGroup | null = null;

	for (const item of items) {
		if (item.kind === "erase") {
			for (const group of groups) group.erasers.push(item);
			current = null;
			continue;
		}
		if (!current) {
			current = { erasers: [], marks: [] };
			groups.push(current);
		}
		current.marks.push(item);
	}

	return groups;
}

/** What `sketchItemsToSvg` needs besides the items. */
export type SketchSvgOptions = {
	width: number;
	height: number;
	/** A literal painted behind everything. Omitted, or unsafe, the SVG is transparent. */
	background?: string | null;
};

const ROUND = 'stroke-linecap="round" stroke-linejoin="round"';

function markToSvg(mark: SketchMark): string {
	if (!isSafeSketchColor(mark.color) || !isSafeSketchPathData(mark.d)) return "";
	return `<path d="${mark.d}" fill="none" stroke="${mark.color}" stroke-width="${formatSketchNumber(mark.width)}" ${ROUND}/>`;
}

function eraserToSvg(eraser: SketchEraser): string {
	if (!isSafeSketchPathData(eraser.d)) return "";
	return `<path d="${eraser.d}" fill="none" stroke="#000" stroke-width="${formatSketchNumber(eraser.width)}" ${ROUND}/>`;
}

/**
 * A self-contained SVG of the drawing.
 *
 * The `viewBox` is the canvas in points, so the file draws at the size it was
 * drawn and scales cleanly. Each masked run gets an inline `<mask>` — a white
 * rect, minus the black strokes of its erasers — with deterministic ids
 * (`m0`, `m1`…), so the same items always export the same string.
 *
 * An item whose colour or path fails the safety check is skipped rather than
 * escaped: there is no correct rendering of a colour that is not a colour.
 */
export function sketchItemsToSvg(items: readonly SketchItem[], options: SketchSvgOptions): string {
	const w = formatSketchNumber(Math.max(0, options.width));
	const h = formatSketchNumber(Math.max(0, options.height));
	let body = "";

	if (options.background && isSafeSketchColor(options.background)) {
		body += `<rect width="${w}" height="${h}" fill="${options.background}"/>`;
	}

	let maskIndex = 0;
	for (const group of groupSketchItems(items)) {
		const marks = group.marks.map(markToSvg).join("");
		if (group.erasers.length === 0) {
			body += marks;
			continue;
		}
		const id = `m${maskIndex++}`;
		body +=
			`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">` +
			`<rect width="${w}" height="${h}" fill="#fff"/>` +
			group.erasers.map(eraserToSvg).join("") +
			"</mask>" +
			`<g mask="url(#${id})">${marks}</g>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/** The drawing with its last item removed. An eraser is one item, undone as one. Nothing to undo returns the same array. */
export function undoSketchItems(items: readonly SketchItem[]): readonly SketchItem[] {
	if (items.length === 0) return items;
	return items.slice(0, -1);
}
