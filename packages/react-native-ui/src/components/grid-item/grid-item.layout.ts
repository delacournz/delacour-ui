/**
 * The placement maths behind `GridItem.Group`.
 *
 * Pure and free of React Native imports, so the whole matrix is reachable from
 * `bun test` — React Native ships Flow-typed source Bun cannot parse. The group
 * calls these in order: measure, `resolveCellSize`, `placeTiles`, then
 * `tileRect` per tile and `gridHeight` for itself.
 */

/** Exactly one of `aspect` or `rowHeight` sizes the rows. */
export type GridItemRowSizing =
	| {
			/** Cell height is cell width divided by this. Default 1 — square cells. */
			aspect?: number;
			rowHeight?: never;
	  }
	| {
			/** Cell height, fixed, in points. */
			rowHeight: number;
			aspect?: never;
	  };

/** How many cells a tile covers along each axis. */
export type GridItemSpan = { colSpan: number; rowSpan: number };

/** Where a tile landed: its top-start cell, and its spans after clamping. */
export type GridItemPlacement = { row: number; col: number; colSpan: number; rowSpan: number };

export type GridItemCellSize = { cellWidth: number; cellHeight: number };

/**
 * A tile's box inside the group, in points. `start` is a logical inset, so it
 * mirrors under right-to-left with no code of its own.
 */
export type GridItemRect = { start: number; top: number; width: number; height: number };

/** An integer of at least one; anything else — zero, a fraction's remainder, NaN — rounds down to that. */
function atLeastOne(value: number): number {
	return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

/** A positive finite number, else 1. */
function positiveOrOne(value: number | undefined): number {
	return value !== undefined && Number.isFinite(value) && value > 0 ? value : 1;
}

/** A track count: an integer of at least one. `0` becomes `1`, `2.7` becomes `2`. */
export function normalizeColumns(columns: number): number {
	return atLeastOne(columns);
}

/**
 * The size of one cell.
 *
 * Width is what is left after the gaps, split evenly across the columns, and
 * never negative — a gap wider than the group yields empty cells rather than
 * tiles drawn backwards. Height is `rowHeight` when given, else width over
 * `aspect` (a zero or negative aspect falls back to square).
 */
export function resolveCellSize(
	width: number,
	columns: number,
	gap: number,
	sizing: GridItemRowSizing
): GridItemCellSize {
	const tracks = normalizeColumns(columns);
	const gutter = Math.max(0, gap);
	const available = Math.max(0, width);
	const cellWidth = Math.max(0, (available - gutter * (tracks - 1)) / tracks);
	if (available === 0 || cellWidth === 0) return { cellWidth: 0, cellHeight: 0 };
	const cellHeight =
		sizing.rowHeight !== undefined ? Math.max(0, sizing.rowHeight) : cellWidth / positiveOrOne(sizing.aspect);
	return { cellWidth, cellHeight };
}

/**
 * Assigns every tile a top-start cell, first fit in row-major order.
 *
 * The search for each tile starts at the previous tile's cell, never earlier,
 * so tiles land in writing order: a hole a wide tile could not fill stays a
 * hole rather than being backfilled by a later, smaller one. That keeps the
 * order a screen reader walks (the children's order) the order the eye reads.
 * A tall tile still leaves the cells beside it free for the tiles after it.
 *
 * Spans are floored to integers of at least one, and `colSpan` is clamped to
 * the column count so an over-wide tile takes a full row instead of never
 * fitting.
 */
export function placeTiles(
	spans: readonly GridItemSpan[],
	columns: number
): { placements: GridItemPlacement[]; rows: number } {
	const tracks = normalizeColumns(columns);
	const occupied: boolean[][] = [];
	const placements: GridItemPlacement[] = [];
	let rows = 0;
	let cursor = 0;

	const isTaken = (row: number, col: number): boolean => occupied[row]?.[col] === true;
	const fits = (row: number, col: number, colSpan: number, rowSpan: number): boolean => {
		if (col + colSpan > tracks) return false;
		for (let r = row; r < row + rowSpan; r++) {
			for (let c = col; c < col + colSpan; c++) {
				if (isTaken(r, c)) return false;
			}
		}
		return true;
	};

	for (const span of spans) {
		const colSpan = Math.min(atLeastOne(span.colSpan), tracks);
		const rowSpan = atLeastOne(span.rowSpan);
		let index = cursor;
		while (!fits(Math.floor(index / tracks), index % tracks, colSpan, rowSpan)) {
			index++;
		}
		const row = Math.floor(index / tracks);
		const col = index % tracks;

		for (let r = row; r < row + rowSpan; r++) {
			const line = occupied[r] ?? [];
			for (let c = col; c < col + colSpan; c++) line[c] = true;
			occupied[r] = line;
		}

		placements.push({ row, col, colSpan, rowSpan });
		rows = Math.max(rows, row + rowSpan);
		cursor = index;
	}

	return { placements, rows };
}

/**
 * A placed tile's box, with every edge snapped to the device pixel grid.
 *
 * Edges are rounded, not sizes: a tile's width is its snapped end minus its
 * snapped start. Rounding each width independently would let the rounding
 * error of neighbours add up into a visible hairline between them; snapping
 * the edges means two neighbours always sit exactly one gap apart.
 */
export function tileRect(
	placement: GridItemPlacement,
	cell: GridItemCellSize,
	gap: number,
	pixelRatio: number
): GridItemRect {
	const ratio = positiveOrOne(pixelRatio);
	const gutter = Math.max(0, gap);
	const snap = (value: number): number => Math.round(value * ratio) / ratio;

	const rawStart = placement.col * (cell.cellWidth + gutter);
	const rawEnd = rawStart + placement.colSpan * cell.cellWidth + (placement.colSpan - 1) * gutter;
	const rawTop = placement.row * (cell.cellHeight + gutter);
	const rawBottom = rawTop + placement.rowSpan * cell.cellHeight + (placement.rowSpan - 1) * gutter;

	const start = snap(rawStart);
	const top = snap(rawTop);
	return { start, top, width: snap(rawEnd) - start, height: snap(rawBottom) - top };
}

/** The group's height: `rows` cells and the gaps between them. No rows, no height. */
export function gridHeight(rows: number, cellHeight: number, gap: number): number {
	if (rows <= 0) return 0;
	return rows * cellHeight + (rows - 1) * Math.max(0, gap);
}

/**
 * The `aspectRatio` a group reserves before it has been measured.
 *
 * Width over height for `rows` rows of cells `columns` wide, gaps ignored —
 * close enough that the measured height replaces it without a visible jump.
 * Never zero, NaN or infinite, all of which Yoga would draw as nothing.
 */
export function resolveInitialAspect(columns: number, rows: number, aspect: number): number {
	return (normalizeColumns(columns) * positiveOrOne(aspect)) / atLeastOne(rows);
}

/**
 * The spans a direct child of the group asks for, read from its props.
 *
 * Any child may carry `colSpan` / `rowSpan` — a `GridItem`, or a wrapper that
 * forwards them. A child that does not is one cell.
 */
export function readGridItemSpan(props: unknown): GridItemSpan {
	if (typeof props !== "object" || props === null) return { colSpan: 1, rowSpan: 1 };
	const colSpan = "colSpan" in props && typeof props.colSpan === "number" ? props.colSpan : 1;
	const rowSpan = "rowSpan" in props && typeof props.rowSpan === "number" ? props.rowSpan : 1;
	return { colSpan, rowSpan };
}
