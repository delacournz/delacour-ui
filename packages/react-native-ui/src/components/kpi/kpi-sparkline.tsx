import type { CurveType } from "@delacour/react-native-charts/core";
import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Chart, type ChartConfig } from "../chart";
import { useChart } from "../chart/chart.context";
import { useKpiLayout, useKpiPart } from "./kpi.context";
import {
	type KpiColorIndex,
	type KpiSparklineData,
	kpiSparklineAccessibilityLabel,
	kpiVariants,
	resolveSparklineDomain,
	resolveSparklineFilled,
	resolveSparklineSeries,
} from "./kpi.variants";

export type KpiSparklineProps = KpiSparklineData & {
	/** Overrides the KPI's `colorIndex` for this chart. */
	colorIndex?: KpiColorIndex;
	/** A theme token or a literal, over the series colour entirely. */
	color?: string;
	/**
	 * Fill under the line. Defaults on under the card and off beside the
	 * number, where a fill would make the chart a second block competing with
	 * the value.
	 */
	filled?: boolean;
	strokeWidth?: number;
	curve?: CurveType;
	/**
	 * Hold and drag to scrub a point: a dot rides the line and the KPI's
	 * `activeIndex` follows it, so a custom part can print that point's value.
	 * On by default. The scrub starts on a hold, so a sparkline in a scrolling
	 * list does not steal the scroll.
	 */
	interactive?: boolean;
	/** Formats the first and last point for the screen-reader summary. */
	formatValue?: (value: number) => string;
	/** Replaces the screen-reader summary — "Trend over 30 points, from 120 to 184". */
	accessibilityLabel?: string;
	className?: string;
	testID?: string;
};

/**
 * Reports the scrubbed index to the KPI, as `null` once the finger lifts.
 *
 * A child of `<Chart>` that is not a mark, so the chart mounts it beside the
 * canvas where its context — and the scrub's shared values — are in reach. It
 * crosses to the JS thread only when the index changes, which is a few times
 * per drag rather than once a frame.
 */
function KpiSparklineScrub({ onChange }: { onChange: (index: number | null) => void }): null {
	const { scrub } = useChart();

	useAnimatedReaction(
		() => (scrub.isActive.value ? scrub.index.value : -1),
		(next, previous) => {
			if (next === previous) return;
			scheduleOnRN(onChange, next < 0 ? null : next);
		}
	);

	return null;
}
KpiSparklineScrub.displayName = "DelacourUI.Kpi.Sparkline.Scrub";

/**
 * The shape the number made getting there — a `Chart` line with no grid, no
 * axes and no padding, in the KPI's series colour.
 *
 * Takes a bare list of numbers, or rows with an `xKey` and a `yKey`. Under the
 * card it is full width and filled; beside the number (`Kpi.Content
 * layout="inline"`) it is a fixed 128pt column, unfilled, so a stack of cards
 * lines its shapes up down the right-hand edge whatever their labels. The y
 * bounds are the data's own, padded a tenth each way, so the peak and trough
 * are not drawn half off the canvas.
 *
 * Announced as one image — how many points and where they started and ended.
 * While the KPI loads it is a muted block of its own size.
 */
export function KpiSparkline(props: KpiSparklineProps): ReactElement {
	const {
		data,
		xKey,
		yKey,
		colorIndex: colorIndexProp,
		color,
		filled: filledProp,
		strokeWidth = 2,
		curve,
		interactive = true,
		formatValue,
		accessibilityLabel,
		className,
		testID,
	} = props;
	const context = useKpiPart("Kpi.Sparkline");
	const layout = useKpiLayout();
	const slots = kpiVariants({ layout, size: context.size });
	const colorIndex = colorIndexProp ?? context.colorIndex;

	// Keyed on the three fields the series reads rather than on the props
	// object, which is new every render and would re-plot the chart with it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	const series = useMemo(() => resolveSparklineSeries(props), [data, xKey, yKey]);
	const domain = useMemo(() => ({ y: resolveSparklineDomain(series.values) }), [series]);
	const config = useMemo<ChartConfig>(
		() => ({ [series.yKey]: { label: series.yKey, color: color ?? `chart-${colorIndex}` } }),
		[series.yKey, color, colorIndex]
	);

	if (context.isLoading) {
		return <View className={slots.sparklinePlaceholder({ className: slots.sparkline({ className }) })} />;
	}

	const filled = resolveSparklineFilled({ filled: filledProp, layout });

	return (
		<View
			accessibilityLabel={accessibilityLabel ?? kpiSparklineAccessibilityLabel(series.values, formatValue)}
			accessibilityRole="image"
			accessible
			className={slots.sparkline({ className })}
		>
			<Chart
				config={config}
				curve={curve}
				data={series.rows}
				domain={domain}
				frameClassName={slots.sparklineFrame()}
				testID={testID}
				xKey={series.xKey}
			>
				{filled ? <Chart.Area yKey={series.yKey} /> : null}
				<Chart.Line strokeWidth={strokeWidth} yKey={series.yKey} />
				{interactive ? <Chart.Tooltip.Dot yKey={series.yKey} /> : null}
				{interactive ? <KpiSparklineScrub onChange={context.setActiveIndex} /> : null}
			</Chart>
		</View>
	);
}
KpiSparkline.displayName = "DelacourUI.Kpi.Sparkline";
