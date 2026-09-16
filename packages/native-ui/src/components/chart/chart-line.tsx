import { ChartLine as EngineLine } from "@delacour/charts";
import type { CurveType } from "@delacour/charts/core";
import type { ReactElement } from "react";
import { useSeriesColor } from "./chart.context";

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
}: ChartLineProps): ReactElement | null {
	const resolved = useSeriesColor(yKey);
	const paint = color ?? resolved;
	if (paint === undefined) return null;

	return (
		<EngineLine
			color={paint}
			connectMissingData={connectMissingData}
			curve={curve}
			opacity={opacity}
			strokeWidth={strokeWidth}
			yKey={yKey}
		/>
	);
}

ChartLine.displayName = "DelacourUI.Chart.Line";
