import { describe, expect, test } from "bun:test";
import type { ChartPoint } from "../chart.types";
import { buildCandlePaths, candlePoints, candleSentiment, SENTIMENTS } from "./build-candles";

const at = (x: number, y: number | null): ChartPoint => ({ x, y, xValue: x, yValue: y });

function commands(path: string): string {
	return (path.match(/[A-Za-z]/g) ?? []).join("");
}

/** Four series from rows of `[open, high, low, close]`, in canvas y (100 − value). */
function series(rows: readonly (readonly [number | null, number | null, number | null, number | null])[]) {
	const pick = (column: 0 | 1 | 2 | 3): ChartPoint[] =>
		rows.map((row, index) => {
			const value = row[column];
			return { x: index * 20 + 10, y: value === null ? null : 100 - value, xValue: index, yValue: value };
		});
	return candlePoints(pick(0), pick(1), pick(2), pick(3));
}

describe("candleSentiment", () => {
	test("close above open is positive, below is negative", () => {
		expect(candleSentiment(10, 12)).toBe("positive");
		expect(candleSentiment(12, 10)).toBe("negative");
	});

	test("an unchanged close is neutral, and so is anything unreadable", () => {
		expect(candleSentiment(10, 10)).toBe("neutral");
		expect(candleSentiment(Number.NaN, 10)).toBe("neutral");
		expect(candleSentiment(null, 10)).toBe("neutral");
		expect(candleSentiment(10, null)).toBe("neutral");
	});
});

describe("candlePoints", () => {
	test("zips the four series by index", () => {
		const candles = series([
			[10, 15, 5, 12],
			[12, 14, 8, 9],
		]);
		expect(candles).toHaveLength(2);
		expect(candles[0]).toMatchObject({ index: 0, x: 10, openValue: 10, closeValue: 12, sentiment: "positive" });
		expect(candles[1]).toMatchObject({ index: 1, x: 30, sentiment: "negative" });
		expect(candles[0]?.highY).toBe(85);
		expect(candles[0]?.lowY).toBe(95);
	});

	test("a row with any missing value is a gap, never dropped", () => {
		const candles = series([[10, null, 5, 12]]);
		expect(candles).toHaveLength(1);
		expect(candles[0]?.gap).toBe(true);
		expect(candles[0]?.sentiment).toBe("neutral");
	});

	test("takes the length of the shortest series", () => {
		expect(candlePoints([at(0, 1), at(1, 1)], [at(0, 1)], [at(0, 1)], [at(0, 1)])).toHaveLength(1);
	});
});

describe("buildCandlePaths", () => {
	const candles = series([
		[10, 15, 5, 12],
		[12, 14, 8, 9],
		[9, 9, 9, 9],
	]);

	test("every candle appears in every sentiment path, so a flip morphs", () => {
		const paths = buildCandlePaths(candles, { bandwidth: 10 });
		const bodies = SENTIMENTS.map((sentiment) => commands(paths[sentiment].bodies));
		const wicks = SENTIMENTS.map((sentiment) => commands(paths[sentiment].wicks));
		expect(bodies[0]).toBe("MCLCLCLCZ".repeat(3));
		expect(bodies[1]).toBe(bodies[0]);
		expect(bodies[2]).toBe(bodies[0]);
		expect(wicks[0]).toBe("ML".repeat(3));
		expect(wicks[1]).toBe(wicks[0]);
		expect(wicks[2]).toBe(wicks[0]);
	});

	test("a body spans open to close, half a bandwidth either side of x", () => {
		const { bodies } = buildCandlePaths(candles, { bandwidth: 10 }).positive;
		// First candle: open 10 → y 90, close 12 → y 88, x 10.
		expect(bodies.startsWith("M5,88")).toBe(true);
		expect(bodies).toContain("L15,88");
		expect(bodies).toContain("L5,90");
	});

	test("a wick runs from the high to the low", () => {
		const { wicks } = buildCandlePaths(candles, { bandwidth: 10 }).positive;
		expect(wicks.startsWith("M10,85L10,95")).toBe(true);
	});

	test("a candle of another sentiment is a degenerate rect and a zero-length wick at its own place", () => {
		const { bodies, wicks } = buildCandlePaths(candles, { bandwidth: 10 }).negative;
		// The first candle is positive, so in the negative path it collapses to
		// its body's midpoint (y 89) — where it will grow from if it flips.
		expect(bodies.startsWith("M10,89")).toBe(true);
		expect(wicks.startsWith("M10,89L10,89")).toBe(true);
	});

	test("a flat candle is neutral and is expanded to the minimum body height", () => {
		const { bodies } = buildCandlePaths(candles, { bandwidth: 10, minBodyHeight: 2 }).neutral;
		// Third candle: everything at 9 → y 91, expanded about 91 to 90..92.
		expect(bodies).toContain("M45,90");
		expect(bodies).toContain("L45,92");
	});

	test("a thin body is expanded to the minimum height about its midpoint", () => {
		const thin = series([[10, 12, 8, 10.2]]);
		const { bodies } = buildCandlePaths(thin, { bandwidth: 10, minBodyHeight: 4 }).positive;
		// open 10 → 90, close 10.2 → 89.8; midpoint 89.9, expanded to 87.9..91.9.
		expect(bodies).toContain("M5,87.9");
		expect(bodies).toContain("L5,91.9");
	});

	test("a gap row is degenerate in all six paths", () => {
		const withGap = series([
			[10, 15, 5, 12],
			[null, 14, 8, 9],
		]);
		const paths = buildCandlePaths(withGap, { bandwidth: 10, baseline: 100 });
		for (const sentiment of SENTIMENTS) {
			expect(commands(paths[sentiment].bodies)).toBe("MCLCLCLCZ".repeat(2));
			expect(paths[sentiment].bodies).toContain("M30,100");
			expect(paths[sentiment].wicks).toContain("M30,100L30,100");
		}
	});

	test("is empty in every path for no candles", () => {
		const paths = buildCandlePaths([], { bandwidth: 10 });
		for (const sentiment of SENTIMENTS) {
			expect(paths[sentiment]).toEqual({ bodies: "", wicks: "" });
		}
	});
});

describe("horizontal candles", () => {
	// Category on y, value on x.
	const horizontal = (rows: readonly (readonly [number, number, number, number])[]) => {
		const pick = (column: 0 | 1 | 2 | 3): ChartPoint[] =>
			rows.map((row, index) => ({ x: row[column], y: index * 20 + 10, xValue: index, yValue: row[column] }));
		return candlePoints(pick(0), pick(1), pick(2), pick(3), "horizontal");
	};

	test("reads the category from y and the values from x", () => {
		const [candle] = horizontal([[10, 15, 5, 12]]);
		expect(candle).toMatchObject({ x: 10, openY: 10, highY: 15, lowY: 5, closeY: 12, sentiment: "positive" });
	});

	test("bodies span open to close on x, a bandwidth tall; wicks run low to high on x", () => {
		const paths = buildCandlePaths(horizontal([[10, 15, 5, 12]]), { bandwidth: 10, orientation: "horizontal" });
		expect(paths.positive.bodies.startsWith("M10,5")).toBe(true);
		expect(paths.positive.bodies).toContain("L12,5");
		expect(paths.positive.bodies).toContain("L10,15");
		expect(paths.positive.wicks).toBe("M15,10L5,10");
	});
});
