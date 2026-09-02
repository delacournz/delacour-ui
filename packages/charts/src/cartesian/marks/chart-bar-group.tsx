import { Path } from "@shopify/react-native-skia";
import { type ReactElement, useEffect, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartOrientation, ChartPoint } from "../../core/chart.types";
import { type Band, groupLayout, resolveBand } from "../../core/geometry/band";
import { buildBarsPath, resolveBaseline } from "../../core/shape/build-bars";
import type { CornerRadii } from "../../core/shape/rect-path";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";
import { categorySpan } from "./chart-bar";

export type ChartBarGroupProps = {
	/** The series to draw side by side, in order. */
	readonly yKeys: readonly string[];
	/** One colour per key, cycled when there are fewer. */
	readonly colors: readonly string[];
	/** The fraction of each step left empty between groups. Defaults to 0.2. */
	readonly betweenGroupPadding?: number;
	/** The fraction of each bar's slot left empty. Defaults to 0.2. */
	readonly withinGroupPadding?: number;
	/** An exact bar width, instead of a fraction of the slot. */
	readonly barWidth?: number;
	/** Size groups as if the plot held this many, so charts of different lengths match. */
	readonly barCount?: number;
	readonly roundedCorners?: CornerRadii;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
	/** Reports the resolved step and bar width, for a legend or a label that wants them. */
	readonly onBarSizeChange?: (band: Band) => void;
};

/**
 * Several series as bars side by side within each step.
 *
 * Takes `yKeys` rather than child marks because a Skia tree gains nothing
 * from identity matching: the group has to know how many series there are
 * before any of them can know its offset, and reading that off children is
 * the same information arriving later.
 *
 * One `<Path>` per series, each with its own animation, so a series that is
 * added or removed morphs on its own without disturbing its neighbours.
 */
export function ChartBarGroup({
	yKeys,
	colors,
	betweenGroupPadding,
	withinGroupPadding,
	barWidth,
	barCount,
	roundedCorners,
	opacity,
	animation,
	onBarSizeChange,
}: ChartBarGroupProps): ReactElement {
	const chart = useChartContext();
	const { bounds, xPositions, orientation } = chart;
	const valueScale = orientation === "horizontal" ? chart.xScale : chart.yScale;

	const layout = useMemo(() => {
		const band = resolveBand({ xPositions, plotWidth: categorySpan(bounds, orientation), barCount });
		const group = groupLayout({
			step: band.step,
			seriesCount: yKeys.length,
			betweenGroupPadding,
			withinGroupPadding,
			barWidth,
		});
		return { step: band.step, bandwidth: group.bandwidth, offsets: group.offsets };
	}, [xPositions, bounds, orientation, barCount, yKeys.length, betweenGroupPadding, withinGroupPadding, barWidth]);

	const baseline = resolveBaseline(valueScale, bounds, orientation);

	useEffect(() => {
		onBarSizeChange?.({ step: layout.step, bandwidth: layout.bandwidth });
	}, [layout.step, layout.bandwidth, onBarSizeChange]);

	return (
		<>
			{yKeys.map((key, index) => (
				<GroupedBarSeries
					animation={animation ?? chart.animation}
					bandwidth={layout.bandwidth}
					baseline={baseline}
					color={colors[index % colors.length] ?? colors[0] ?? "transparent"}
					key={key}
					offset={layout.offsets[index] ?? 0}
					opacity={opacity}
					orientation={orientation}
					points={chart.points[key] ?? []}
					roundedCorners={roundedCorners}
				/>
			))}
		</>
	);
}

ChartBarGroup.displayName = "DelacourCharts.ChartBarGroup";

type GroupedBarSeriesProps = {
	readonly points: readonly ChartPoint[];
	readonly bandwidth: number;
	readonly baseline: number;
	readonly offset: number;
	readonly orientation: ChartOrientation;
	readonly roundedCorners?: CornerRadii;
	readonly color: string;
	readonly opacity?: number;
	readonly animation: ChartAnimation;
};

/** One series of the group. A component of its own so each path owns its hooks. */
function GroupedBarSeries({
	points,
	bandwidth,
	baseline,
	offset,
	orientation,
	roundedCorners,
	color,
	opacity,
	animation,
}: GroupedBarSeriesProps): ReactElement {
	const path = useMemo(
		() => toSkPath(buildBarsPath(points, { bandwidth, baseline, offset, roundedCorners, orientation })),
		[points, bandwidth, baseline, offset, roundedCorners, orientation]
	);
	const animated = useAnimatedPath(path, animation);
	return <Path color={color} opacity={opacity} path={animated} style="fill" />;
}

GroupedBarSeries.displayName = "DelacourCharts.ChartBarGroup.Series";
