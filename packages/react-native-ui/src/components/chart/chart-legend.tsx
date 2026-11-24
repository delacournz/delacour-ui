import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { useChartSeries } from "./chart.context";
import type { ChartDash } from "./chart.types";

const SWATCH_SEGMENTS = 3;
const SWATCH_THICKNESS = 2;

/**
 * A short dashed line sample: the series' dash repeated, so the legend carries
 * the same non-colour cue as the line. Sized inline because the dash lengths
 * are data, not a token. Hidden from assistive tech like the solid swatch: the
 * label beside it names the series.
 */
function DashedSwatch({ color, dash, testID }: { color: string; dash: ChartDash; testID: string }): ReactElement {
	const [on, off] = dash;
	const segments = Array.from({ length: SWATCH_SEGMENTS }, (_, index) => index);
	return (
		<View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={{ flexDirection: "row", alignItems: "center" }}
			testID={testID}
		>
			{segments.map((index) => (
				<View
					key={index}
					style={{
						width: on,
						height: SWATCH_THICKNESS,
						marginRight: index === SWATCH_SEGMENTS - 1 ? 0 : off,
						backgroundColor: color,
					}}
				/>
			))}
		</View>
	);
}

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
					{entry.dash === undefined ? (
						<View
							accessibilityElementsHidden
							className={slots.legendSwatch()}
							importantForAccessibility="no-hide-descendants"
							style={{ backgroundColor: entry.color }}
							testID={`chart-legend-swatch-${entry.key}`}
						/>
					) : (
						<DashedSwatch color={entry.color} dash={entry.dash} testID={`chart-legend-swatch-${entry.key}`} />
					)}
					<Text className={slots.legendLabel()}>{entry.label}</Text>
				</View>
			))}
		</View>
	);
}

ChartLegend.displayName = "DelacourUI.Chart.Legend";
