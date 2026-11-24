import { ChartLine as EngineLine } from "@delacour/react-native-charts";
import type { CurveType } from "@delacour/react-native-charts/core";
import type { ReactElement } from "react";
import { useChartSeries } from "./chart.context";
import type { ChartDash } from "./chart.types";

export type ChartLineProps = {
	/** Which series to draw. Names a key of the chart's `config`. */
	yKey: string;
	/** Overrides the series' colour from the config. A token or a literal. */
	color?: string;
	strokeWidth?: number;
	curve?: CurveType;
	/** Draw straight through a gap instead of breaking the line. */
	connectMissingData?: boolean;
	opacity?: number;
	/**
	 * Visible `[on, off]` points of a dashed stroke. Overrides the series'
	 * `dash` from the config; `false` forces it solid. Colour alone cannot tell
	 * series apart for everyone (WCAG 1.4.1), so a dash is the second cue.
	 */
	dash?: ChartDash | false;
};

/**
 * A stroked line through one series, in that series' colour.
 *
 * A Skia mark, so it takes values and not classNames — there is nothing for
 * `cn()` to merge on a canvas node and nothing Uniwind could compile. The
 * colour comes from the chart's `config` by key, so a call site names the data
 * and never the paint.
 */
export function ChartLine({
	yKey,
	color,
	strokeWidth = 2,
	curve,
	connectMissingData,
	opacity,
	dash,
}: ChartLineProps): ReactElement | null {
	const { series } = useChartSeries();
	const entry = series.find((item) => item.key === yKey);
	const paint = color ?? entry?.color;
	if (paint === undefined) return null;
	const pattern = dash === false ? undefined : (dash ?? entry?.dash);

	return (
		<EngineLine
			color={paint}
			connectMissingData={connectMissingData}
			curve={curve}
			dash={pattern}
			opacity={opacity}
			strokeWidth={strokeWidth}
			yKey={yKey}
		/>
	);
}

ChartLine.displayName = "DelacourUI.Chart.Line";
