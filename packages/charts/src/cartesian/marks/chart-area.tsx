import { LinearGradient, Path, vec } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartPoint, ChartSegment } from "../../core/chart.types";
import { buildAreaPath } from "../../core/curve/build-area";
import type { CurveType } from "../../core/curve/curves";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";

export type ChartAreaProps = {
	readonly yKey?: string;
	readonly points?: readonly ChartPoint[];
	/**
	 * Stacked segments to draw as a band, from each one's `y0` up to its `y`.
	 *
	 * Usually `chart.stacked[key]`. Takes precedence over `yKey` and `points`,
	 * and a gap in the band closes against `baseline` as a gap in a fill does.
	 */
	readonly segments?: readonly ChartSegment[];
	/** A flat fill. Give this or `gradient`, not both. */
	readonly color?: string;
	/** Top-to-bottom stops. Two or more; the last is usually transparent. */
	readonly gradient?: readonly string[];
	/** Canvas y the fill closes against — an x on a horizontal chart. Defaults to the plot rect's bottom, or its left. */
	readonly baseline?: number;
	readonly curve?: CurveType;
	readonly connectMissingData?: boolean;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
};

/**
 * The region between a series and a baseline.
 *
 * The gradient runs the height of the **plot rect**, not of the path's own
 * bounds. Anchoring it to the path would make the same data fade differently
 * as the domain changed, so two charts side by side would disagree about what
 * a colour meant.
 */
export function ChartArea({
	yKey,
	points,
	segments,
	color,
	gradient,
	baseline,
	curve,
	connectMissingData,
	opacity,
	animation,
}: ChartAreaProps): ReactElement {
	const chart = useChartContext();
	const series = segments ?? points ?? (yKey === undefined ? [] : (chart.points[yKey] ?? []));
	const { orientation } = chart;
	const floor = baseline ?? (orientation === "horizontal" ? chart.bounds.left : chart.bounds.bottom);

	const path = useMemo(
		() =>
			toSkPath(
				buildAreaPath(series, {
					baseline: floor,
					curve: curve ?? chart.curve,
					connectMissingData,
					lower: segments?.map((segment) => segment.y0),
					orientation,
				})
			),
		[series, segments, floor, curve, chart.curve, connectMissingData, orientation]
	);

	const animated = useAnimatedPath(path, animation ?? chart.animation);

	return (
		<Path color={gradient ? undefined : color} opacity={opacity} path={animated} style="fill">
			{gradient === undefined ? null : (
				<LinearGradient colors={[...gradient]} end={vec(0, chart.bounds.bottom)} start={vec(0, chart.bounds.top)} />
			)}
		</Path>
	);
}

ChartArea.displayName = "DelacourCharts.ChartArea";
