import { describe, expect, test } from "bun:test";
import {
	type GridItemPlacement,
	type GridItemSpan,
	gridHeight,
	normalizeColumns,
	placeTiles,
	readGridItemSpan,
	resolveCellSize,
	resolveInitialAspect,
	tileRect,
} from "./grid-item.layout";

/** `[colSpan, rowSpan]` pairs to span objects, so a table reads as the spec does. */
function spans(...pairs: [number, number][]): GridItemSpan[] {
	return pairs.map(([colSpan, rowSpan]) => ({ colSpan, rowSpan }));
}

/** The `(row, col)` of each placement, for a compact comparison. */
function cells(placements: GridItemPlacement[]): [number, number][] {
	return placements.map(({ row, col }) => [row, col]);
}

/** A small seeded generator, so the property tests are random but repeatable. */
function seeded(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
		return state / 2_147_483_648;
	};
}

describe("normalizeColumns", () => {
	test("an integer of at least one passes through", () => {
		expect(normalizeColumns(1)).toBe(1);
		expect(normalizeColumns(4)).toBe(4);
	});

	test("zero, negatives and non-finite values become one", () => {
		expect(normalizeColumns(0)).toBe(1);
		expect(normalizeColumns(-3)).toBe(1);
		expect(normalizeColumns(Number.NaN)).toBe(1);
		expect(normalizeColumns(Number.POSITIVE_INFINITY)).toBe(1);
	});

	test("a fraction is floored", () => {
		expect(normalizeColumns(2.7)).toBe(2);
	});
});

describe("resolveCellSize", () => {
	test("square cells by default", () => {
		expect(resolveCellSize(342, 2, 12, {})).toEqual({ cellWidth: 165, cellHeight: 165 });
	});

	test("aspect divides the cell width", () => {
		expect(resolveCellSize(342, 2, 12, { aspect: 2 })).toEqual({ cellWidth: 165, cellHeight: 82.5 });
	});

	test("rowHeight fixes the cell height", () => {
		expect(resolveCellSize(342, 2, 12, { rowHeight: 100 })).toEqual({ cellWidth: 165, cellHeight: 100 });
	});

	test("an unmeasured group has empty cells", () => {
		expect(resolveCellSize(0, 2, 12, {})).toEqual({ cellWidth: 0, cellHeight: 0 });
	});

	test("a gap wider than the group never makes a cell negative", () => {
		const cell = resolveCellSize(100, 4, 40, {});
		expect(cell.cellWidth).toBe(0);
		expect(cell.cellHeight).toBe(0);
	});

	test("columns are an integer of at least one", () => {
		expect(resolveCellSize(342, 0, 12, {}).cellWidth).toBe(342);
		expect(resolveCellSize(342, 2.7, 12, {}).cellWidth).toBe(165);
	});

	test("a zero or negative aspect falls back to one", () => {
		expect(resolveCellSize(342, 2, 12, { aspect: 0 }).cellHeight).toBe(165);
		expect(resolveCellSize(342, 2, 12, { aspect: -2 }).cellHeight).toBe(165);
	});

	test("a negative gap is treated as none", () => {
		expect(resolveCellSize(300, 2, -10, {}).cellWidth).toBe(150);
	});
});

describe("placeTiles", () => {
	test("single cells fill row-major", () => {
		const result = placeTiles(spans([1, 1], [1, 1], [1, 1]), 2);
		expect(cells(result.placements)).toEqual([
			[0, 0],
			[0, 1],
			[1, 0],
		]);
		expect(result.rows).toBe(2);
	});

	test("a tall tile reserves the cell below it", () => {
		const result = placeTiles(spans([2, 1], [1, 2], [1, 1], [1, 1]), 3);
		expect(cells(result.placements)).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 1],
		]);
		expect(result.rows).toBe(2);
	});

	test("a small tile tucks in beside a tall one", () => {
		const result = placeTiles(spans([1, 2], [1, 1], [1, 1]), 2);
		expect(cells(result.placements)).toEqual([
			[0, 0],
			[0, 1],
			[1, 1],
		]);
		expect(result.rows).toBe(2);
	});

	test("a span wider than the grid is clamped to it", () => {
		const result = placeTiles(spans([3, 1]), 2);
		expect(result.placements).toEqual([{ row: 0, col: 0, colSpan: 2, rowSpan: 1 }]);
		expect(result.rows).toBe(1);
	});

	test("a span below one is raised to one", () => {
		const result = placeTiles(spans([1, 0]), 2);
		expect(result.placements[0]?.rowSpan).toBe(1);
		expect(placeTiles(spans([0, 1]), 2).placements[0]?.colSpan).toBe(1);
	});

	test("a fractional span is floored", () => {
		expect(placeTiles(spans([1.9, 2.5]), 3).placements[0]).toEqual({ row: 0, col: 0, colSpan: 1, rowSpan: 2 });
	});

	test("no tiles, no rows", () => {
		expect(placeTiles([], 2)).toEqual({ placements: [], rows: 0 });
	});

	// Monotonic: a tile never backfills a hole left earlier, so screen-reader
	// order (the children's order) and reading order agree.
	test("does not backfill an earlier hole", () => {
		const result = placeTiles(spans([1, 1], [2, 1], [1, 1]), 2);
		expect(cells(result.placements)).toEqual([
			[0, 0],
			[1, 0],
			[2, 0],
		]);
		expect(result.rows).toBe(3);
	});

	const random = seeded(42);
	const cases = Array.from({ length: 200 }, () => {
		const columns = 1 + Math.floor(random() * 6);
		const count = Math.floor(random() * 14);
		const list = Array.from({ length: count }, () => ({
			colSpan: 1 + Math.floor(random() * 4),
			rowSpan: 1 + Math.floor(random() * 3),
		}));
		return { columns, list };
	});

	test("no two tiles share a cell", () => {
		for (const { columns, list } of cases) {
			const { placements, rows } = placeTiles(list, columns);
			const taken = new Set<string>();
			for (const tile of placements) {
				expect(tile.col + tile.colSpan).toBeLessThanOrEqual(columns);
				expect(tile.row + tile.rowSpan).toBeLessThanOrEqual(rows);
				for (let r = tile.row; r < tile.row + tile.rowSpan; r++) {
					for (let c = tile.col; c < tile.col + tile.colSpan; c++) {
						const key = `${r}:${c}`;
						expect(taken.has(key)).toBe(false);
						taken.add(key);
					}
				}
			}
		}
	});

	test("each tile lands at or after the one before it, in writing order", () => {
		for (const { columns, list } of cases) {
			const { placements } = placeTiles(list, columns);
			for (let index = 1; index < placements.length; index++) {
				const previous = placements[index - 1] as GridItemPlacement;
				const current = placements[index] as GridItemPlacement;
				expect(current.row * columns + current.col).toBeGreaterThanOrEqual(previous.row * columns + previous.col);
			}
		}
	});
});

describe("tileRect", () => {
	const cell = resolveCellSize(342, 2, 12, {});

	test("a full-width tile spans the grid", () => {
		const rect = tileRect({ row: 0, col: 0, colSpan: 2, rowSpan: 1 }, cell, 12, 3);
		expect(rect.start).toBe(0);
		expect(rect.width).toBe(342);
	});

	test("the second column starts one cell and one gap in", () => {
		const rect = tileRect({ row: 0, col: 1, colSpan: 1, rowSpan: 1 }, cell, 12, 3);
		expect(rect.start).toBe(177);
		expect(rect.width).toBe(165);
	});

	test("a spanning tile's height includes the gaps it crosses", () => {
		const rect = tileRect({ row: 1, col: 0, colSpan: 1, rowSpan: 2 }, cell, 12, 3);
		expect(rect.top).toBe(177);
		expect(rect.height).toBe(2 * 165 + 12);
	});

	test("snapped neighbours keep exactly one gap between them", () => {
		for (const width of [343, 351.3, 390, 402.7]) {
			for (const columns of [2, 3, 4, 6]) {
				const odd = resolveCellSize(width, columns, 12, { aspect: 1.37 });
				for (let col = 0; col < columns - 1; col++) {
					const a = tileRect({ row: 0, col, colSpan: 1, rowSpan: 1 }, odd, 12, 3);
					const b = tileRect({ row: 0, col: col + 1, colSpan: 1, rowSpan: 1 }, odd, 12, 3);
					expect(a.start + a.width + 12).toBeCloseTo(b.start, 9);
					const below = tileRect({ row: 1, col, colSpan: 1, rowSpan: 1 }, odd, 12, 3);
					expect(a.top + a.height + 12).toBeCloseTo(below.top, 9);
				}
			}
		}
	});

	test("every edge sits on the pixel grid", () => {
		const odd = resolveCellSize(351.3, 3, 12, {});
		const rect = tileRect({ row: 1, col: 1, colSpan: 2, rowSpan: 1 }, odd, 12, 3);
		for (const edge of [rect.start, rect.top, rect.start + rect.width, rect.top + rect.height]) {
			expect(Math.abs(edge * 3 - Math.round(edge * 3))).toBeLessThan(1e-9);
		}
	});

	test("a pixel ratio of zero falls back to one", () => {
		const odd = resolveCellSize(343, 2, 12, {});
		const rect = tileRect({ row: 0, col: 1, colSpan: 1, rowSpan: 1 }, odd, 12, 0);
		expect(Number.isInteger(rect.start)).toBe(true);
	});
});

describe("gridHeight", () => {
	test("rows of cells and the gaps between them", () => {
		expect(gridHeight(2, 165, 12)).toBe(342);
		expect(gridHeight(1, 100, 12)).toBe(100);
	});

	test("no rows, no height", () => {
		expect(gridHeight(0, 165, 12)).toBe(0);
	});
});

describe("resolveInitialAspect", () => {
	test("columns times aspect over rows", () => {
		expect(resolveInitialAspect(2, 2, 1)).toBe(1);
		expect(resolveInitialAspect(4, 2, 1)).toBe(2);
		expect(resolveInitialAspect(2, 1, 2)).toBe(4);
	});

	test("never zero, NaN or infinite", () => {
		for (const [columns, rows, aspect] of [
			[0, 0, 0],
			[2, 0, 1],
			[2, 2, 0],
			[2, 2, -1],
			[Number.NaN, 2, 1],
			[2, Number.NaN, Number.NaN],
		] as const) {
			const value = resolveInitialAspect(columns, rows, aspect);
			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThan(0);
		}
	});
});

describe("readGridItemSpan", () => {
	test("reads numeric spans from a child's props", () => {
		expect(readGridItemSpan({ colSpan: 2, rowSpan: 3 })).toEqual({ colSpan: 2, rowSpan: 3 });
	});

	test("a child without spans is one cell", () => {
		expect(readGridItemSpan({})).toEqual({ colSpan: 1, rowSpan: 1 });
		expect(readGridItemSpan(null)).toEqual({ colSpan: 1, rowSpan: 1 });
		expect(readGridItemSpan({ colSpan: "2" })).toEqual({ colSpan: 1, rowSpan: 1 });
	});
});
