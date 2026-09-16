import { ChartYAxis as EngineYAxis } from "@delacour/charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartYAxisProps = {
	color?: string;
	tickPadding?: number;
	side?: "left" | "right";
	opacity?: number;
};

/** Tick labels beside the plot, right-aligned so they form a clean column. */
export function ChartYAxis({ color, tickPadding, side, opacity }: ChartYAxisProps): ReactElement | null {
	const { axisColor } = useChart();
	const paint = color ?? axisColor;
	if (paint === undefined) return null;

	return <EngineYAxis color={paint} opacity={opacity} side={side} tickPadding={tickPadding} />;
}

ChartYAxis.displayName = "DelacourUI.Chart.YAxis";
