import { PieInset, PieSlices } from "@delacour/charts";
import { type ReactElement, useMemo } from "react";
import { usePieChart } from "./pie-chart.context";

export type PieChartSliceProps = {
	opacity?: number;
	/**
	 * A hairline between neighbouring slices, in the chart's background.
	 *
	 * On by default: two ramp colours side by side with no gap read as one
	 * shape with a stripe, and the gap is what makes each wedge its own.
	 */
	stroke?: boolean;
	/** The hairline's width. */
	strokeWidth?: number;
	/** Opacity of every slice but the selected one, while one is selected. `1` turns the dim off. */
	dimUnselected?: number;
};

/**
 * Every slice of the pie, one wedge per row, in the series' colours.
 *
 * The colours come from the context already resolved, so this is the engine's
 * `PieSlices` given a list of strings. While a slice is selected — by a tap or
 * through `selectedIndex` — the others dim, because a selection that changes
 * nothing on screen looks like a tap that missed.
 */
export function PieChartSlice({
	opacity,
	stroke = true,
	strokeWidth = 2,
	dimUnselected = 0.4,
}: PieChartSliceProps): ReactElement {
	const { series, surfaceColor } = usePieChart();
	const colors = useMemo(() => series.map((entry) => entry.color), [series]);

	return (
		<>
			<PieSlices colors={colors} dimUnselected={dimUnselected} opacity={opacity} />
			{stroke && surfaceColor !== undefined ? <PieInset color={surfaceColor} strokeWidth={strokeWidth} /> : null}
		</>
	);
}

PieChartSlice.displayName = "DelacourUI.PieChart.Slice";
