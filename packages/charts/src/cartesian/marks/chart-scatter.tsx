import { Path } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartPoint } from "../../core/chart.types";
import { resolveBaseline } from "../../core/shape/build-bars";
import { buildScatterPath, type ScatterShape } from "../../core/shape/build-scatter";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";

export type ChartScatterProps = {
	/** Which series to draw. Read from the chart's context. */
	readonly yKey?: string;
	/** The points to draw, when they are not coming from context. */
	readonly points?: readonly ChartPoint[];
	readonly color: string;
	/** One radius for every point, or one per point. Defaults to 4. */
	readonly radius?: number | ((point: ChartPoint, index: number) => number);
	readonly shape?: ScatterShape;
	/** Filled discs, or rings. */
	readonly style?: "fill" | "stroke";
	readonly strokeWidth?: number;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
};

/**
 * One shape per datum.
 *
 * All the shapes are one `<Path>`, so a hundred points is one Skia node. A
 * gap is the same shape at radius zero on the baseline, which is what keeps
 * the series interpolatable when a datum comes and goes.
 */
export function ChartScatter({
	yKey,
	points,
	color,
	radius = 4,
	shape = "circle",
	style = "fill",
	strokeWidth = 1,
	opacity,
	animation,
}: ChartScatterProps): ReactElement {
	const chart = useChartContext();
	const series = points ?? (yKey === undefined ? [] : (chart.points[yKey] ?? []));
	const { orientation } = chart;
	const baseline = resolveBaseline(
		orientation === "horizontal" ? chart.xScale : chart.yScale,
		chart.bounds,
		orientation
	);

	const path = useMemo(
		() => toSkPath(buildScatterPath(series, { radius, shape, baseline, orientation })),
		[series, radius, shape, baseline, orientation]
	);
	const animated = useAnimatedPath(path, animation ?? chart.animation);

	return (
		<Path
			color={color}
			opacity={opacity}
			path={animated}
			strokeWidth={style === "stroke" ? strokeWidth : undefined}
			style={style}
		/>
	);
}

ChartScatter.displayName = "DelacourCharts.ChartScatter";
