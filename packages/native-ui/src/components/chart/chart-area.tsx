import { ChartArea as EngineArea, useChartContext as useEngineChart } from "@delacour/charts";
import type { CurveType } from "@delacour/charts/core";
import type { ReactElement } from "react";
import { useSeriesColor } from "./chart.context";
import { resolveAreaFill } from "./chart.variants";

export type ChartAreaProps = {
	yKey: string;
	/**
	 * Stack this area on every sibling area that names the same id.
	 *
	 * A stacked area is a band from the top of the series below it to its
	 * own running total, so the topmost edge reads as the sum. One stack per
	 * chart, shared with the bars: a second id, or an area stack beside a bar
	 * stack, throws by name.
	 */
	stackId?: string;
	color?: string;
	curve?: CurveType;
	connectMissingData?: boolean;
	/**
	 * Fade the fill out towards the baseline instead of painting it flat.
	 *
	 * On by default for a lone area: a flat fill at any readable opacity
	 * competes with the line it sits under. Off by default for a stacked band,
	 * which has to read as a distinct region — see `resolveAreaFill`.
	 */
	gradient?: boolean;
	/** Opacity of the fill — at its top when it fades, throughout when flat. */
	opacity?: number;
};

/**
 * The region under a series, in that series' colour.
 *
 * The fade is built from the resolved colour rather than from an opacity prop
 * on the whole mark, so the top of the fill keeps the series' hue at reduced
 * strength and the bottom reaches genuine transparency. Fading the node instead
 * would leave a visible flat edge along the baseline.
 *
 * A stacked area reads its segments from the engine's context — the root
 * stacked them in data space so the y domain covers the totals — and draws
 * the band between each segment's base and its top. It is placed inside the
 * canvas, which is why the engine's own context is in reach here. A band is
 * painted flat: three fades over the full plot height blur into one wash,
 * and nothing then says where one series ends and the next begins.
 */
export function ChartArea({
	yKey,
	stackId,
	color,
	curve,
	connectMissingData,
	gradient: gradientProp,
	opacity: opacityProp,
}: ChartAreaProps): ReactElement | null {
	const resolved = useSeriesColor(yKey);
	const { stacked } = useEngineChart();
	const paint = color ?? resolved;
	if (paint === undefined) return null;
	const segments = stackId === undefined ? undefined : stacked[yKey];
	const { gradient, opacity } = resolveAreaFill({
		stacked: stackId !== undefined,
		gradient: gradientProp,
		opacity: opacityProp,
	});

	if (!gradient) {
		return (
			<EngineArea
				color={paint}
				connectMissingData={connectMissingData}
				curve={curve}
				opacity={opacity}
				segments={segments}
				yKey={yKey}
			/>
		);
	}

	return (
		<EngineArea
			connectMissingData={connectMissingData}
			curve={curve}
			gradient={[paint, "transparent"]}
			opacity={opacity}
			segments={segments}
			yKey={yKey}
		/>
	);
}

ChartArea.displayName = "DelacourUI.Chart.Area";
