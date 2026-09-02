import { Path } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartPoint } from "../../core/chart.types";
import { buildLinePath } from "../../core/curve/build-line";
import type { CurveType } from "../../core/curve/curves";
import { toSkPath } from "../../skia/build-path";
import { useChartContext } from "../cartesian-chart.context";

export type ChartLineProps = {
	/** Which series to draw. Read from the chart's context. */
	readonly yKey?: string;
	/** The points to draw, when they are not coming from context. */
	readonly points?: readonly ChartPoint[];
	readonly color: string;
	readonly strokeWidth?: number;
	readonly curve?: CurveType;
	readonly connectMissingData?: boolean;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
	readonly strokeCap?: "butt" | "round" | "square";
	readonly strokeJoin?: "bevel" | "miter" | "round";
};

/**
 * A stroked line through a series.
 *
 * Takes `yKey` or `points`, never needing both: given a key it reads the
 * chart's context, given points it draws exactly those. One implementation
 * serves the declarative call site and the render-prop one, so the two can
 * never drift.
 *
 * The default `round` cap and join are not cosmetic. A `butt` cap on a
 * two-point series leaves the stroke visibly short of its own endpoint, and a
 * `miter` join spikes at a sharp reversal in volatile data.
 */
export function ChartLine({
	yKey,
	points,
	color,
	strokeWidth = 2,
	curve,
	connectMissingData,
	opacity,
	animation,
	strokeCap = "round",
	strokeJoin = "round",
}: ChartLineProps): ReactElement {
	const chart = useChartContext();
	const series = points ?? (yKey === undefined ? [] : (chart.points[yKey] ?? []));

	const path = useMemo(
		() => toSkPath(buildLinePath(series, { curve: curve ?? chart.curve, connectMissingData })),
		[series, curve, chart.curve, connectMissingData]
	);

	const animated = useAnimatedPath(path, animation ?? chart.animation);

	return (
		<Path
			color={color}
			opacity={opacity}
			path={animated}
			strokeCap={strokeCap}
			strokeJoin={strokeJoin}
			strokeWidth={strokeWidth}
			style="stroke"
		/>
	);
}

ChartLine.displayName = "DelacourCharts.ChartLine";
