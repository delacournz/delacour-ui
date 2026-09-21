import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { useChartSeries } from "./chart.context";

export type ChartLegendProps = {
	className?: string;
	/** Show only these series, in this order. Defaults to all of them. */
	keys?: readonly string[];
};

/**
 * A swatch and a label per series, under the chart.
 *
 * Shared by `Chart` and `PieChart`: it reads whichever context is above it,
 * since a legend row is a colour and a name under either root.
 *
 * A React Native view, not a Skia node, and the distinction is whether it
 * moves *with* the canvas. A legend sits beside the plot and is static
 * relative to it, so it can have the type scale, a colour token and a
 * className — none of which exist on a canvas. Axis labels are the opposite
 * case: they move under a pan and belong in Skia.
 */
export function ChartLegend({ className, keys }: ChartLegendProps): ReactElement {
	const { series, slots } = useChartSeries();
	const shown = keys === undefined ? series : keys.flatMap((key) => series.filter((entry) => entry.key === key));

	return (
		<View className={cn(slots.legend(), className)}>
			{shown.map((entry) => (
				<View className={slots.legendItem()} key={entry.key}>
					<View className={slots.legendSwatch()} style={{ backgroundColor: entry.color }} />
					<Text className={slots.legendLabel()}>{entry.label}</Text>
				</View>
			))}
		</View>
	);
}

ChartLegend.displayName = "DelacourUI.Chart.Legend";
