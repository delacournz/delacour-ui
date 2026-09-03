import { Path, type SkPath } from "@shopify/react-native-skia";
import { type ReactElement, useEffect, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import { resolveBand } from "../../core/geometry/band";
import { buildCandlePaths, candlePoints, SENTIMENTS, type Sentiment } from "../../core/shape/build-candles";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";
import { categorySpan } from "./chart-bar";

export type ChartCandlestickKeys = {
	readonly open: string;
	readonly high: string;
	readonly low: string;
	readonly close: string;
};

export type ChartCandleColors = Readonly<Record<Sentiment, string>>;

export type ChartCandlestickProps = {
	/** The four series. Each must be one of the chart's `yKeys`. */
	readonly keys: ChartCandlestickKeys;
	readonly candleColors: ChartCandleColors;
	/** The fraction of each step a body fills. Defaults to 0.6. */
	readonly candleRatio?: number;
	/** An exact body width, instead of a fraction of the step. */
	readonly candleWidth?: number;
	/** Size candles as if the plot held this many, so charts of different lengths match. */
	readonly candleCount?: number;
	/** A body thinner than this is expanded so a flat candle stays visible. Defaults to 1. */
	readonly minBodyHeight?: number;
	readonly wickStrokeWidth?: number;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
};

/**
 * Open-high-low-close candles.
 *
 * Six `<Path>` nodes: bodies and wicks for each of the three sentiments, and
 * every candle is present in all six, degenerate where its sentiment does not
 * apply. A candle that flips therefore morphs from one colour into the other
 * rather than snapping — see `buildCandlePaths`. Wicks draw first so a body
 * covers the wick that passes through it, and with **butt** caps, because a
 * round cap on a zero-length wick is a dot at every non-matching candle.
 */
export function ChartCandlestick({
	keys,
	candleColors,
	candleRatio = 0.6,
	candleWidth,
	candleCount,
	minBodyHeight,
	wickStrokeWidth = 1,
	opacity,
	animation,
}: ChartCandlestickProps): ReactElement {
	const chart = useChartContext();
	const { bounds, xPositions, points, orientation } = chart;

	useEffect(() => {
		if (!__DEV__) return;
		for (const key of [keys.open, keys.high, keys.low, keys.close]) {
			if (points[key] === undefined) {
				console.warn(
					`[delacour-react-native-charts] <ChartCandlestick> was given the key "${key}" but the chart has no series ` +
						"by that name. Every candle key has to be one of the chart's yKeys."
				);
			}
		}
	}, [keys, points]);

	const paths = useMemo(() => {
		const band = resolveBand({
			xPositions,
			plotWidth: categorySpan(bounds, orientation),
			innerPadding: 1 - candleRatio,
			barWidth: candleWidth,
			barCount: candleCount,
		});
		const candles = candlePoints(
			points[keys.open] ?? [],
			points[keys.high] ?? [],
			points[keys.low] ?? [],
			points[keys.close] ?? [],
			orientation
		);
		const built = buildCandlePaths(candles, {
			bandwidth: band.bandwidth,
			minBodyHeight,
			baseline: orientation === "horizontal" ? bounds.left : bounds.bottom,
			orientation,
		});
		const toSk = (sentiment: Sentiment): { bodies: SkPath; wicks: SkPath } => ({
			bodies: toSkPath(built[sentiment].bodies),
			wicks: toSkPath(built[sentiment].wicks),
		});
		return { positive: toSk("positive"), negative: toSk("negative"), neutral: toSk("neutral") };
	}, [xPositions, bounds, points, keys, orientation, candleRatio, candleWidth, candleCount, minBodyHeight]);

	const motion = animation ?? chart.animation;

	return (
		<>
			{SENTIMENTS.map((sentiment) => (
				<CandlePath
					animation={motion}
					color={candleColors[sentiment]}
					key={`${sentiment}-wicks`}
					opacity={opacity}
					path={paths[sentiment].wicks}
					strokeWidth={wickStrokeWidth}
				/>
			))}
			{SENTIMENTS.map((sentiment) => (
				<CandlePath
					animation={motion}
					color={candleColors[sentiment]}
					key={`${sentiment}-bodies`}
					opacity={opacity}
					path={paths[sentiment].bodies}
				/>
			))}
		</>
	);
}

ChartCandlestick.displayName = "DelacourCharts.ChartCandlestick";

type CandlePathProps = {
	readonly path: SkPath;
	readonly color: string;
	readonly opacity?: number;
	readonly animation: ChartAnimation;
	/** Set for a wick path; a body is filled. */
	readonly strokeWidth?: number;
};

/** One of the six paths. A component of its own so each path owns its animation hook. */
function CandlePath({ path, color, opacity, animation, strokeWidth }: CandlePathProps): ReactElement {
	const animated = useAnimatedPath(path, animation);
	if (strokeWidth === undefined) return <Path color={color} opacity={opacity} path={animated} style="fill" />;
	return (
		<Path color={color} opacity={opacity} path={animated} strokeCap="butt" strokeWidth={strokeWidth} style="stroke" />
	);
}

CandlePath.displayName = "DelacourCharts.ChartCandlestick.Path";
