import {
	type ChartBarStackSegmentInfo,
	type ChartBarStackSegmentOptions,
	ChartBar as EngineBar,
	ChartBarGroup as EngineBarGroup,
	ChartBarStack as EngineBarStack,
} from "delacour-react-native-charts";
import { type ReactElement, useCallback, useMemo } from "react";
import { useChart } from "./chart.context";
import { barCorners, barRadiusFor, type ChartBarProps, resolveBarLabels } from "./chart-bar";

export type ChartBarsProps = {
	/** Every `Chart.Bar`'s props, in placement order. */
	readonly bars: readonly ChartBarProps[];
};

/**
 * Every `Chart.Bar` of the chart, drawn as one arrangement.
 *
 * Internal. The root collects the `Chart.Bar` children, resolves them with
 * `resolveBarLayout`, and mounts one of these where the first bar stood —
 * a single engine bar, a group or a stack, depending on what it found. A
 * bar cannot draw itself because it cannot see its siblings, and the width
 * of every bar depends on how many share a step.
 *
 * Colours come from each bar's series; `rounded` and `opacity` are read
 * from the first bar that sets them, because a group is one path per series
 * but one radius for all — corners that differed across a group would read
 * as a mistake. A stack rounds only its outermost segment, so the column
 * reads as one bar; every inner segment is square where it meets the next.
 */
export function ChartBars({ bars }: ChartBarsProps): ReactElement | null {
	const { bars: layout, series, barRadius, axisColor, data } = useChart();

	const radius = barRadiusFor(bars.find((bar) => bar.rounded !== undefined)?.rounded, barRadius);
	const corners = useMemo(() => barCorners(radius), [radius]);
	const opacity = bars.find((bar) => bar.opacity !== undefined)?.opacity;

	const colors = useMemo(
		() =>
			layout.keys.map((key) => {
				const bar = bars.find((entry) => entry.yKey === key);
				return bar?.color ?? series.find((entry) => entry.key === key)?.color ?? "transparent";
			}),
		[layout.keys, bars, series]
	);

	const barOptions = useCallback(
		(info: ChartBarStackSegmentInfo): ChartBarStackSegmentOptions => (info.isTop ? { roundedCorners: corners } : {}),
		[corners]
	);

	const first = bars[0];
	if (first === undefined || layout.mode === "none") return null;

	if (layout.mode === "single") {
		return (
			<EngineBar
				color={colors[0]}
				labels={resolveBarLabels(first.labels, axisColor, data)}
				opacity={opacity}
				roundedCorners={corners}
				yKey={first.yKey}
			/>
		);
	}

	if (layout.mode === "grouped") {
		return <EngineBarGroup colors={colors} opacity={opacity} roundedCorners={corners} yKeys={layout.keys} />;
	}

	return <EngineBarStack barOptions={barOptions} colors={colors} opacity={opacity} yKeys={layout.keys} />;
}

ChartBars.displayName = "DelacourUI.Chart.Bars";
