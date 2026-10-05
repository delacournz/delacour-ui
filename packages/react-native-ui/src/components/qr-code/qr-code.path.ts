import type { QrLogoRegion, QrMatrix } from "./qr-code.constants";

/**
 * A matrix as one SVG `d` string, in module units with the quiet zone as an
 * offset — the renderer scales it with a `viewBox`. Pure, so `bun test` reaches
 * every module style.
 */

export const QR_MODULE_STYLES = ["square", "rounded", "dots"] as const;
export type QrModuleStyle = (typeof QR_MODULE_STYLES)[number];

/** A dot never touches its neighbour, so it reads as a dot rather than a blob. */
const DOT_RADIUS = 0.42;
const MODULE_RADIUS = 0.5;
const FINDER_RING_RADIUS = 1.75;
const FINDER_HOLE_RADIUS = 1;
const FINDER_CORE_RADIUS = 1;
/** The smallest symbol — anything below it is a test fixture, not a code with finders. */
const MIN_SYMBOL_SIZE = 21;

/** `0.5` → `.5`, `-0.5` → `-.5`, no float noise: path data is long, every byte counts. */
function num(value: number): string {
	const rounded = Math.round(value * 1000) / 1000;
	return String(rounded === 0 ? 0 : rounded).replace(/^(-?)0\./, "$1.");
}

function inRegion(region: QrLogoRegion | undefined, row: number, col: number): boolean {
	if (!region) return false;
	return (
		row >= region.start && row < region.start + region.side && col >= region.start && col < region.start + region.side
	);
}

/** Whether (row, col) sits in one of the three 7 x 7 finder patterns. */
function inFinder(size: number, row: number, col: number): boolean {
	if (size < MIN_SYMBOL_SIZE) return false;
	const top = row < 7;
	const left = col < 7;
	const right = col >= size - 7;
	const bottom = row >= size - 7;
	return (top && left) || (top && right) || (bottom && left);
}

/** A rounded rectangle, clockwise, or anticlockwise to punch a hole under the non-zero rule. */
function roundedRect(x: number, y: number, width: number, height: number, radius: number, clockwise: boolean): string {
	const r = num(radius);
	const across = num(width - 2 * radius);
	const down = num(height - 2 * radius);
	if (clockwise) {
		return (
			`M${num(x)} ${num(y + radius)}a${r} ${r} 0 0 1 ${r} -${r}h${across}a${r} ${r} 0 0 1 ${r} ${r}` +
			`v${down}a${r} ${r} 0 0 1 -${r} ${r}h-${across}a${r} ${r} 0 0 1 -${r} -${r}z`
		);
	}
	return (
		`M${num(x + radius)} ${num(y)}a${r} ${r} 0 0 0 -${r} ${r}v${down}a${r} ${r} 0 0 0 ${r} ${r}` +
		`h${across}a${r} ${r} 0 0 0 ${r} -${r}v-${down}a${r} ${r} 0 0 0 -${r} -${r}z`
	);
}

/** The three finders as a 7 x 7 ring and a 3 x 3 core — the shape a decoder locks onto, in every style. */
function finderShapes(size: number, quietZone: number): string {
	let d = "";
	for (const [row, col] of [
		[0, 0],
		[0, size - 7],
		[size - 7, 0],
	] as const) {
		const x = col + quietZone;
		const y = row + quietZone;
		d += roundedRect(x, y, 7, 7, FINDER_RING_RADIUS, true);
		d += roundedRect(x + 1, y + 1, 5, 5, FINDER_HOLE_RADIUS, false);
		d += roundedRect(x + 2, y + 2, 3, 3, FINDER_CORE_RADIUS, true);
	}
	return d;
}

type Dark = (row: number, col: number) => boolean;

/** Horizontal runs, then runs with the same span on consecutive rows merged into one taller rect. */
function squarePath(size: number, dark: Dark, quietZone: number): string {
	type Rect = { x: number; y: number; width: number; height: number };
	const rects: Rect[] = [];
	let open = new Map<string, Rect>();

	for (let row = 0; row < size; row++) {
		const next = new Map<string, Rect>();
		let col = 0;
		while (col < size) {
			if (!dark(row, col)) {
				col++;
				continue;
			}
			const start = col;
			while (col < size && dark(row, col)) col++;
			const key = `${start}:${col - start}`;
			const above = open.get(key);
			if (above) {
				above.height++;
				next.set(key, above);
			} else {
				const rect = { x: start, y: row, width: col - start, height: 1 };
				rects.push(rect);
				next.set(key, rect);
			}
		}
		open = next;
	}

	rects.sort((a, b) => a.y - b.y || a.x - b.x);
	return rects
		.map(
			({ x, y, width, height }) =>
				`M${num(x + quietZone)} ${num(y + quietZone)}h${num(width)}v${num(height)}h-${num(width)}z`
		)
		.join("");
}

/** Each module rounded only on the corners where neither orthogonal neighbour is dark, so runs fuse. */
function roundedPath(size: number, dark: Dark, quietZone: number): string {
	const r = num(MODULE_RADIUS);
	let d = "";
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!dark(row, col)) continue;
			const up = dark(row - 1, col);
			const down = dark(row + 1, col);
			const left = dark(row, col - 1);
			const right = dark(row, col + 1);
			const topLeft = !up && !left ? MODULE_RADIUS : 0;
			const topRight = !up && !right ? MODULE_RADIUS : 0;
			const bottomRight = !down && !right ? MODULE_RADIUS : 0;
			const bottomLeft = !down && !left ? MODULE_RADIUS : 0;
			const x = col + quietZone;
			const y = row + quietZone;

			d += `M${num(x)} ${num(y + topLeft)}`;
			if (topLeft) d += `a${r} ${r} 0 0 1 ${r} -${r}`;
			d += `h${num(1 - topLeft - topRight)}`;
			if (topRight) d += `a${r} ${r} 0 0 1 ${r} ${r}`;
			d += `v${num(1 - topRight - bottomRight)}`;
			if (bottomRight) d += `a${r} ${r} 0 0 1 -${r} ${r}`;
			d += `h-${num(1 - bottomRight - bottomLeft)}`;
			if (bottomLeft) d += `a${r} ${r} 0 0 1 -${r} -${r}`;
			d += "z";
		}
	}
	return d;
}

/** A circle per dark module, as two half-arcs. */
function dotsPath(size: number, dark: Dark, quietZone: number): string {
	const r = num(DOT_RADIUS);
	const diameter = num(DOT_RADIUS * 2);
	let d = "";
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!dark(row, col)) continue;
			const x = col + quietZone + 0.5 - DOT_RADIUS;
			const y = row + quietZone + 0.5;
			d += `M${num(x)} ${num(y)}a${r} ${r} 0 1 0 ${diameter} 0a${r} ${r} 0 1 0 -${diameter} 0z`;
		}
	}
	return d;
}

/**
 * The whole code as one path. `square` draws finders as ordinary modules;
 * `rounded` and `dots` draw them as concentric shapes and every other dark
 * module in their own style. Modules inside `clear` are left out — the logo's
 * plate sits there.
 */
export function buildQrPath(matrix: QrMatrix, style: QrModuleStyle, quietZone: number, clear?: QrLogoRegion): string {
	const { size, modules } = matrix;
	const isDark = (row: number, col: number): boolean =>
		row >= 0 && col >= 0 && row < size && col < size && modules[row * size + col] === 1 && !inRegion(clear, row, col);

	if (style === "square") return squarePath(size, isDark, quietZone);

	const dataDark: Dark = (row, col) => isDark(row, col) && !inFinder(size, row, col);
	const finders = size >= MIN_SYMBOL_SIZE ? finderShapes(size, quietZone) : "";
	const body = style === "rounded" ? roundedPath(size, dataDark, quietZone) : dotsPath(size, dataDark, quietZone);
	return finders + body;
}

/**
 * The largest per-module size that is a whole number of device pixels, and the
 * offset that centres the drawn code in the tile — also on a device pixel.
 * Fractional module edges are where hairline seams between runs come from; the
 * cost is a margin of under one module.
 */
export function resolveRenderScale(
	size: number,
	units: number,
	pixelRatio: number
): { moduleDp: number; offset: number } {
	const ratio = pixelRatio > 0 && Number.isFinite(pixelRatio) ? pixelRatio : 1;
	const tilePx = Math.round(size * ratio);
	const modulePx = Math.max(1, Math.floor(tilePx / Math.max(1, units)));
	const offsetPx = Math.max(0, Math.floor((tilePx - modulePx * units) / 2));
	return { moduleDp: modulePx / ratio, offset: offsetPx / ratio };
}
