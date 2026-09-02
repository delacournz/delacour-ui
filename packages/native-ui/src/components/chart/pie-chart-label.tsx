import { PieLabel } from "@delacour/charts";
import type { PieSliceData } from "@delacour/charts/core";
import { type ReactElement, useCallback } from "react";
import { type PieLabelFormat, pieLabelText } from "./chart.variants";
import { usePieChart } from "./pie-chart.context";

export type PieChartLabelProps = {
	/** What each label prints. Defaults to the slice's share, as `42%`. */
	format?: PieLabelFormat;
	/**
	 * Overrides the chart's background, which the labels are drawn in.
	 *
	 * A literal, or a value already resolved — a Skia mark cannot look a token
	 * up, for the reason the folder's `AGENTS.md` opens with.
	 */
	color?: string;
	/** Across the annulus: 0 the inner edge, 1 the outer, more than 1 outside. */
	radiusOffset?: number;
	/** Slices narrower than this, in degrees, get no label. */
	minSweep?: number;
	opacity?: number;
};

/**
 * A text label on every slice wide enough to hold one.
 *
 * Skia text in the chart's background colour, so it reads on any slice of the
 * ramp; the axis labels are the precedent for text living in the canvas. A
 * slice under twelve degrees gets none, because a label wider than its wedge
 * lands on the neighbours and three overlapping labels are less legible than
 * none.
 */
export function PieChartLabel({
	format,
	color,
	radiusOffset,
	minSweep = 12,
	opacity,
}: PieChartLabelProps): ReactElement | null {
	const { surfaceColor } = usePieChart();
	const formatLabel = useCallback((slice: PieSliceData) => pieLabelText(format, slice), [format]);
	const paint = color ?? surfaceColor;
	if (paint === undefined) return null;

	return (
		<PieLabel
			color={paint}
			formatLabel={formatLabel}
			minSweep={minSweep}
			opacity={opacity}
			radiusOffset={radiusOffset}
		/>
	);
}

PieChartLabel.displayName = "DelacourUI.PieChart.Label";
