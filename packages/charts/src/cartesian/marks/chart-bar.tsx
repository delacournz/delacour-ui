import { Path, type SkFont, Text } from "@shopify/react-native-skia";
import { type ReactElement, type ReactNode, useEffect, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import type { ChartBounds, ChartOrientation, ChartPoint } from "../../core/chart.types";
import { resolveBand } from "../../core/geometry/band";
import { categoryDomainCovers } from "../../core/geometry/category-domain";
import { pickAxisRoles } from "../../core/geometry/chart-layout";
import { type BarRect, barRects, barsPathFromRects, resolveBaseline } from "../../core/shape/build-bars";
import type { CornerRadii } from "../../core/shape/rect-path";
import { type BarLabelPosition, barLabelAnchor } from "../../core/text/bar-label";
import type { LabelMetrics } from "../../core/text/label-anchor";
import { toSkPath } from "../../skia/build-path";
import { fontMetrics, measureLabelWidth } from "../../skia/font";
import { useChartContext } from "../cartesian-chart.context";
import type { ChartContextValue } from "../cartesian-chart.types";

export type ChartBarLabels = {
	/** Defaults to `top` — the value end, which flips below a negative bar. */
	readonly position?: BarLabelPosition;
	/** Defaults to the chart's font. Nothing draws while it is `null`. */
	readonly font?: SkFont | null;
	readonly color: string;
	/** Defaults to the value as a string. Return `""` to skip a bar. */
	readonly formatLabel?: (point: ChartPoint, index: number) => string;
	/** Space between the bar and the label. */
	readonly gap?: number;
	readonly opacity?: number;
};

export type ChartBarProps = {
	/** Which series to draw. Read from the chart's context. */
	readonly yKey?: string;
	/** The points to draw, when they are not coming from context. */
	readonly points?: readonly ChartPoint[];
	readonly color?: string;
	readonly opacity?: number;
	/** The fraction of each step left empty. Defaults to 0.2. */
	readonly innerPadding?: number;
	/** An exact bar width, instead of a fraction of the step. */
	readonly barWidth?: number;
	/** Size bars as if the plot held this many, so charts of different lengths match. */
	readonly barCount?: number;
	/** `topLeft`/`topRight` are the value end; a negative bar rounds its bottom instead. */
	readonly roundedCorners?: CornerRadii;
	readonly animation?: ChartAnimation;
	/** A value printed against each bar. */
	readonly labels?: ChartBarLabels;
	/** Skia children of the path — a gradient, a shader. */
	readonly children?: ReactNode;
};

/**
 * One bar per datum, standing on zero.
 *
 * Every bar in the series is one `<Path>`, and every corner of every bar is a
 * cubic, so a change of data morphs rather than snaps — see `rectPath`. A gap
 * is a zero-height bar at the baseline for the same reason.
 *
 * The width comes from `resolveBand` against the chart's x positions: there is
 * no band scale here, so the step is measured. The chart's x domain has to be
 * padded by half a step each side for the first and last bars to sit inside
 * the plot; the development-only warning below names the prop that does it.
 */
export function ChartBar({
	yKey,
	points,
	color,
	opacity,
	innerPadding,
	barWidth,
	barCount,
	roundedCorners,
	animation,
	labels,
	children,
}: ChartBarProps): ReactElement {
	const chart = useChartContext();
	const series = points ?? (yKey === undefined ? [] : (chart.points[yKey] ?? []));
	const { bounds, xPositions, orientation } = chart;
	const valueScale = orientation === "horizontal" ? chart.xScale : chart.yScale;

	const rects = useMemo(() => {
		const band = resolveBand({
			xPositions,
			plotWidth: categorySpan(bounds, orientation),
			innerPadding,
			barWidth,
			barCount,
		});
		return barRects(series, {
			bandwidth: band.bandwidth,
			baseline: resolveBaseline(valueScale, bounds, orientation),
			orientation,
		});
	}, [series, xPositions, bounds, valueScale, orientation, innerPadding, barWidth, barCount]);

	const path = useMemo(
		() => toSkPath(barsPathFromRects(rects, roundedCorners, orientation)),
		[rects, roundedCorners, orientation]
	);
	const animated = useAnimatedPath(path, animation ?? chart.animation);

	useBarDomainWarning(series, chart);

	return (
		<>
			<Path color={color} opacity={opacity} path={animated} style="fill">
				{children}
			</Path>
			{labels === undefined ? null : <BarLabels chart={chart} labels={labels} rects={rects} series={series} />}
		</>
	);
}

ChartBar.displayName = "DelacourCharts.ChartBar";

/** The plot's extent along the category axis — its width, or its height when horizontal. */
export function categorySpan(bounds: ChartBounds, orientation: ChartOrientation): number {
	return orientation === "horizontal" ? bounds.bottom - bounds.top : bounds.right - bounds.left;
}

/**
 * Warns, in development, when the x domain cannot hold the first or last bar.
 *
 * The domain the root measures ends exactly at the outermost data, so a bar
 * centred there is half off the plot. There is no way for a mark to widen the
 * domain — the root owns it — so this says which prop to reach for.
 */
function useBarDomainWarning(series: readonly ChartPoint[], chart: ChartContextValue): void {
	const { xStep, orientation } = chart;
	// The category scale is `yScale` on a horizontal chart; asking by role is
	// what stopped this warning firing on every horizontal bar.
	const categoryScale = pickAxisRoles(chart.xScale, chart.yScale, orientation).category;

	useEffect(() => {
		if (!__DEV__ || categoryDomainCovers(series, categoryScale, xStep.value)) return;
		console.warn(
			"[delacour-react-native-charts] the x domain does not cover the first or last bar, so it is drawn half " +
				"outside the plot. Pass domainPadding={{ x: 0.5 }} to the chart to pad the domain by half a step each side."
		);
	}, [series, categoryScale, xStep.value]);
}

type BarLabelsProps = {
	readonly chart: ChartContextValue;
	readonly labels: ChartBarLabels;
	readonly rects: readonly BarRect[];
	readonly series: readonly ChartPoint[];
};

/** One Skia `<Text>` per bar with a value. Draws nothing while the font is `null`. */
function BarLabels({ chart, labels, rects, series }: BarLabelsProps): ReactElement | null {
	const font = labels.font === undefined ? chart.font : labels.font;
	const metrics: LabelMetrics = labels.font === undefined ? chart.fontMetrics : fontMetrics(labels.font);
	if (font === null) return null;
	const position = labels.position ?? "top";
	const format = labels.formatLabel ?? defaultBarLabel;

	return (
		<>
			{rects.map((rect, index) => {
				const point = series[index];
				if (point === undefined || point.yValue === null) return null;
				const text = format(point, index);
				if (text === "") return null;
				const anchor = barLabelAnchor({
					rect,
					position,
					width: measureLabelWidth(font, text),
					metrics,
					gap: labels.gap,
					orientation: chart.orientation,
				});
				return (
					<Text
						color={labels.color}
						font={font}
						key={`${index}-${text}`}
						opacity={labels.opacity}
						text={text}
						x={anchor.x}
						y={anchor.y}
					/>
				);
			})}
		</>
	);
}

BarLabels.displayName = "DelacourCharts.ChartBar.Labels";

function defaultBarLabel(point: ChartPoint): string {
	return point.yValue === null ? "" : String(point.yValue);
}
