import type { ChartOrientation, ChartPoint } from "../chart.types";
import { rectPath } from "./rect-path";

/** Which way a candle went: close above open, below it, or unchanged. */
export type Sentiment = "positive" | "negative" | "neutral";

export const SENTIMENTS: readonly Sentiment[] = ["positive", "negative", "neutral"];

/**
 * One candle, in canvas positions and domain values.
 *
 * `x` is the category's position and the four `…Y` fields are positions
 * along the value axis. On a horizontal chart those axes swap — `x` is then
 * a canvas y and `openY` a canvas x — and the names keep the vertical case,
 * like `xValue` and `yValue` do.
 */
export type Candle = {
	readonly index: number;
	readonly x: number;
	readonly openY: number;
	readonly highY: number;
	readonly lowY: number;
	readonly closeY: number;
	readonly openValue: number | null;
	readonly highValue: number | null;
	readonly lowValue: number | null;
	readonly closeValue: number | null;
	readonly sentiment: Sentiment;
	/** Any of the four values missing. The canvas fields are then `NaN`. */
	readonly gap: boolean;
};

/** Close above open is positive. Equal, or anything unreadable, is neutral. */
export function candleSentiment(openValue: number | null, closeValue: number | null): Sentiment {
	if (openValue === null || closeValue === null || !Number.isFinite(openValue) || !Number.isFinite(closeValue)) {
		return "neutral";
	}
	if (closeValue > openValue) return "positive";
	if (closeValue < openValue) return "negative";
	return "neutral";
}

/**
 * Four series zipped into candles by index.
 *
 * A row missing any of the four is a gap candle, kept in its place, so the
 * candle count — and therefore the verb count of every path — matches the
 * row count.
 */
export function candlePoints(
	open: readonly ChartPoint[],
	high: readonly ChartPoint[],
	low: readonly ChartPoint[],
	close: readonly ChartPoint[],
	orientation: ChartOrientation = "vertical"
): Candle[] {
	const length = Math.min(open.length, high.length, low.length, close.length);
	const horizontal = orientation === "horizontal";
	const valueAt = (point: ChartPoint): number | null => (horizontal ? point.x : point.y);
	const candles: Candle[] = [];

	for (let index = 0; index < length; index += 1) {
		const o = open[index] as ChartPoint;
		const h = high[index] as ChartPoint;
		const l = low[index] as ChartPoint;
		const c = close[index] as ChartPoint;
		const gap = [o, h, l, c].some((point) => {
			const value = valueAt(point);
			return value === null || !Number.isFinite(value) || point.yValue === null;
		});
		candles.push({
			index,
			x: (horizontal ? o.y : o.x) ?? Number.NaN,
			openY: gap ? Number.NaN : (valueAt(o) as number),
			highY: gap ? Number.NaN : (valueAt(h) as number),
			lowY: gap ? Number.NaN : (valueAt(l) as number),
			closeY: gap ? Number.NaN : (valueAt(c) as number),
			openValue: o.yValue,
			highValue: h.yValue,
			lowValue: l.yValue,
			closeValue: c.yValue,
			sentiment: gap ? "neutral" : candleSentiment(o.yValue, c.yValue),
			gap,
		});
	}

	return candles;
}

export type CandlePathOptions = {
	readonly bandwidth: number;
	/** A body thinner than this is expanded about its midpoint, so a flat candle is still visible. Defaults to 1. */
	readonly minBodyHeight?: number;
	/** Canvas position along the value axis a gap candle collapses to. Defaults to 0. */
	readonly baseline?: number;
	/** Bodies span open to close along y (the default) or along x. */
	readonly orientation?: ChartOrientation;
};

export type CandlePaths = {
	readonly bodies: string;
	readonly wicks: string;
};

/**
 * Bodies and wicks, one pair of paths per sentiment.
 *
 * **Every candle appears in all three sentiment paths.** In the two whose
 * sentiment it does not have it is a zero-size rect and a zero-length wick at
 * its own midpoint. Six paths of N shapes each, always, so a candle whose
 * close crosses its open morphs from one colour's path into the other rather
 * than vanishing from one and appearing in the next — and so the paths stay
 * interpolatable across the change at all.
 *
 * A gap candle is degenerate in all six, at the baseline. Wicks are drawn
 * with butt caps by the mark, which is what makes a zero-length wick draw
 * nothing rather than a dot.
 */
export function buildCandlePaths(
	candles: readonly Candle[],
	options: CandlePathOptions
): Record<Sentiment, CandlePaths> {
	const { bandwidth, minBodyHeight = 1, baseline = 0, orientation = "vertical" } = options;
	const horizontal = orientation === "horizontal";
	const half = bandwidth / 2;
	// A rect stated as (category from, value from, category to, value to).
	const rect = (c0: number, v0: number, c1: number, v1: number): string =>
		horizontal ? rectPath(v0, c0, v1, c1, {}) : rectPath(c0, v0, c1, v1, {});
	const line = (c: number, v0: number, v1: number): string =>
		horizontal ? `M${v0},${c}L${v1},${c}` : `M${c},${v0}L${c},${v1}`;
	const bodies: Record<Sentiment, string> = { positive: "", negative: "", neutral: "" };
	const wicks: Record<Sentiment, string> = { positive: "", negative: "", neutral: "" };

	for (const candle of candles) {
		const mid = candle.gap ? baseline : (candle.openY + candle.closeY) / 2;
		for (const sentiment of SENTIMENTS) {
			if (candle.gap || sentiment !== candle.sentiment) {
				bodies[sentiment] += rect(candle.x, mid, candle.x, mid);
				wicks[sentiment] += line(candle.x, mid, mid);
				continue;
			}
			const height = Math.max(Math.abs(candle.closeY - candle.openY), minBodyHeight);
			bodies[sentiment] += rect(candle.x - half, mid - height / 2, candle.x + half, mid + height / 2);
			wicks[sentiment] += line(candle.x, candle.highY, candle.lowY);
		}
	}

	return {
		positive: { bodies: bodies.positive, wicks: wicks.positive },
		negative: { bodies: bodies.negative, wicks: wicks.negative },
		neutral: { bodies: bodies.neutral, wicks: wicks.neutral },
	};
}
