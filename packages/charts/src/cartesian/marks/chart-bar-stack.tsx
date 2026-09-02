import { Path } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartOrientation, ChartSegment } from "../../core/chart.types";
import { resolveBand } from "../../core/geometry/band";
import { barRects, barsPathFromRects, resolveBaseline } from "../../core/shape/build-bars";
import type { CornerRadii } from "../../core/shape/rect-path";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";
import { categorySpan } from "./chart-bar";

/** Where one segment sits in its stack, for `barOptions`. */
export type ChartBarStackSegmentInfo = {
	readonly seriesIndex: number;
	readonly datumIndex: number;
	/** The segment furthest from zero on its side of the axis — the stack's outer end. */
	readonly isTop: boolean;
	/** The segment nearest zero on its side of the axis. */
	readonly isBottom: boolean;
	/** The first datum. */
	readonly isStart: boolean;
	/** The last datum. */
	readonly isEnd: boolean;
};

export type ChartBarStackSegmentOptions = {
	/** `topLeft`/`topRight` are the value end, which for a negative segment is its canvas bottom. */
	readonly roundedCorners?: CornerRadii;
};

export type ChartBarStackProps = {
	/** The series to stack, bottom first. Each must be in the chart's `stackKeys`. */
	readonly yKeys: readonly string[];
	/** One colour per key, cycled when there are fewer. */
	readonly colors: readonly string[];
	/** The fraction of each step left empty. Defaults to 0.25. */
	readonly innerPadding?: number;
	/** An exact bar width, instead of a fraction of the step. */
	readonly barWidth?: number;
	/** Size bars as if the plot held this many, so charts of different lengths match. */
	readonly barCount?: number;
	/**
	 * Per-segment options — the way to round only the outermost segment.
	 *
	 * Corners are the only per-segment option because a series is one `<Path>`
	 * node, and a path has one colour and one opacity. Per-datum colour would
	 * need a node per bar, which is what this design exists to avoid.
	 */
	readonly barOptions?: (info: ChartBarStackSegmentInfo) => ChartBarStackSegmentOptions;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
};

/**
 * Several series stacked on one another within each step.
 *
 * Reads `chart.stacked`, not `chart.points`: the root stacks in data space so
 * that the y domain covers the totals, and a mark that stacked for itself
 * would draw past the top of the plot. A key missing from the root's
 * `stackKeys` has no stacked series and draws nothing.
 *
 * One `<Path>` per series, so the segments of one series morph together and
 * a series can be added or removed without re-keying the others.
 */
export function ChartBarStack({
	yKeys,
	colors,
	innerPadding = 0.25,
	barWidth,
	barCount,
	barOptions,
	opacity,
	animation,
}: ChartBarStackProps): ReactElement {
	const chart = useChartContext();
	const { bounds, xPositions, stacked, orientation } = chart;
	const valueScale = orientation === "horizontal" ? chart.xScale : chart.yScale;

	const bandwidth = useMemo(
		() =>
			resolveBand({ xPositions, plotWidth: categorySpan(bounds, orientation), innerPadding, barWidth, barCount })
				.bandwidth,
		[xPositions, bounds, orientation, innerPadding, barWidth, barCount]
	);
	const baseline = resolveBaseline(valueScale, bounds, orientation);

	// Which series is the outer end of each column, on each side of zero. A
	// null segment is skipped, so the series above a gap is the outer end.
	const ends = useMemo(() => stackEnds(yKeys.map((key) => stacked[key] ?? [])), [yKeys, stacked]);

	return (
		<>
			{yKeys.map((key, seriesIndex) => (
				<StackedBarSeries
					animation={animation ?? chart.animation}
					bandwidth={bandwidth}
					barOptions={barOptions}
					baseline={baseline}
					color={colors[seriesIndex % colors.length] ?? colors[0] ?? "transparent"}
					ends={ends}
					key={key}
					opacity={opacity}
					orientation={orientation}
					segments={stacked[key] ?? []}
					seriesIndex={seriesIndex}
				/>
			))}
		</>
	);
}

ChartBarStack.displayName = "DelacourCharts.ChartBarStack";

/** Per datum: the series index nearest and furthest from zero, per sign. */
type StackEnds = readonly {
	readonly firstPositive: number;
	readonly lastPositive: number;
	readonly firstNegative: number;
	readonly lastNegative: number;
}[];

/** Which side of zero a segment lies on, or `null` for a gap. */
function segmentSign(segment: ChartSegment | undefined): "positive" | "negative" | null {
	if (segment === undefined || segment.yValue === null || segment.y0Value === null) return null;
	return segment.yValue < segment.y0Value ? "negative" : "positive";
}

function stackEnds(series: readonly (readonly ChartSegment[])[]): StackEnds {
	const length = Math.max(0, ...series.map((segments) => segments.length));
	const ends: {
		firstPositive: number;
		lastPositive: number;
		firstNegative: number;
		lastNegative: number;
	}[] = [];
	for (let datum = 0; datum < length; datum += 1) {
		const end = { firstPositive: -1, lastPositive: -1, firstNegative: -1, lastNegative: -1 };
		series.forEach((segments, index) => {
			const sign = segmentSign(segments[datum]);
			if (sign === "negative") {
				if (end.firstNegative === -1) end.firstNegative = index;
				end.lastNegative = index;
			} else if (sign === "positive") {
				if (end.firstPositive === -1) end.firstPositive = index;
				end.lastPositive = index;
			}
		});
		ends.push(end);
	}
	return ends;
}

type StackedBarSeriesProps = {
	readonly segments: readonly ChartSegment[];
	readonly seriesIndex: number;
	readonly ends: StackEnds;
	readonly bandwidth: number;
	readonly baseline: number;
	readonly orientation: ChartOrientation;
	readonly barOptions?: (info: ChartBarStackSegmentInfo) => ChartBarStackSegmentOptions;
	readonly color: string;
	readonly opacity?: number;
	readonly animation: ChartAnimation;
};

/** One series of the stack. A component of its own so each path owns its hooks. */
function StackedBarSeries({
	segments,
	seriesIndex,
	ends,
	bandwidth,
	baseline,
	orientation,
	barOptions,
	color,
	opacity,
	animation,
}: StackedBarSeriesProps): ReactElement {
	const path = useMemo(() => {
		const rects = barRects(segments, { bandwidth, baseline, orientation });
		const corners = barOptions === undefined ? undefined : rects.map((rect) => barOptions(segmentInfo(rect.index)));
		return toSkPath(
			barsPathFromRects(
				rects,
				corners?.map((options) => options.roundedCorners),
				orientation
			)
		);

		function segmentInfo(datumIndex: number): ChartBarStackSegmentInfo {
			const end = ends[datumIndex];
			const negative = segmentSign(segments[datumIndex]) === "negative";
			return {
				seriesIndex,
				datumIndex,
				isTop: end !== undefined && (negative ? end.lastNegative : end.lastPositive) === seriesIndex,
				isBottom: end !== undefined && (negative ? end.firstNegative : end.firstPositive) === seriesIndex,
				isStart: datumIndex === 0,
				isEnd: datumIndex === segments.length - 1,
			};
		}
	}, [segments, seriesIndex, ends, bandwidth, baseline, orientation, barOptions]);

	const animated = useAnimatedPath(path, animation);
	return <Path color={color} opacity={opacity} path={animated} style="fill" />;
}

StackedBarSeries.displayName = "DelacourCharts.ChartBarStack.Series";
