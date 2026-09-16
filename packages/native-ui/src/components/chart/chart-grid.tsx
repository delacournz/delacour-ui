import { ChartGrid as EngineGrid } from "@delacour/charts";
import type { GridAxis } from "@delacour/charts/core";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartGridProps = {
	/** Which ticks get a rule. Defaults to the y ticks alone. */
	axis?: GridAxis;
	/** Overrides the `border` token this paints with. */
	color?: string;
	lineWidth?: number;
	opacity?: number;
	/** Dash on/off lengths, in points. */
	dash?: readonly [number, number];
};

/**
 * A hairline rule at each tick.
 *
 * Painted with `border`, not a chart token of its own. A gridline is a rule
 * between regions, which is what `Separator` already uses `border` for — and
 * inventing a `--chart-grid` would be a token no pasted shadcn theme supplies,
 * so every borrowed palette would leave the grid on this package's default.
 */
export function ChartGrid({ axis, color, lineWidth, opacity, dash }: ChartGridProps): ReactElement | null {
	const { gridColor } = useChart();
	const paint = color ?? gridColor;
	if (paint === undefined) return null;

	return <EngineGrid axis={axis} color={paint} dash={dash} lineWidth={lineWidth} opacity={opacity} />;
}

ChartGrid.displayName = "DelacourUI.Chart.Grid";
