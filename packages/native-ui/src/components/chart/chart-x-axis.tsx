import { ChartXAxis as EngineXAxis } from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartXAxisProps = {
	/** Overrides the `muted-foreground` token this paints with. */
	color?: string;
	/** Space between the plot rect and the labels. */
	tickPadding?: number;
	opacity?: number;
};

/**
 * Tick labels below the plot.
 *
 * `muted-foreground`, the colour every secondary label in this package already
 * uses — an axis names the scale, it does not compete with the data.
 */
export function ChartXAxis({ color, tickPadding, opacity }: ChartXAxisProps): ReactElement | null {
	const { axisColor } = useChart();
	const paint = color ?? axisColor;
	if (paint === undefined) return null;

	return <EngineXAxis color={paint} opacity={opacity} tickPadding={tickPadding} />;
}

ChartXAxis.displayName = "DelacourUI.Chart.XAxis";
