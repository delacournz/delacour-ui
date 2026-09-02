import { Text } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { anchorX, anchorY } from "../../core/text/label-anchor";
import { measureLabelWidth } from "../../skia/font";
import { useChartContext } from "../cartesian-chart.context";

export type ChartXAxisProps = {
	readonly color: string;
	/** Space between the plot rect and the labels. */
	readonly tickPadding?: number;
	readonly opacity?: number;
};

/**
 * Tick labels below the plot rect.
 *
 * Skia text, not React Native text. Under a pan or a zoom the marks move on
 * the UI thread; overlaid RN labels would move on the JavaScript thread and
 * lag them by a frame, which is the most visible bug a chart can have. Labels
 * that sit *beside* the canvas rather than moving with it — a legend, a
 * tooltip — are the opposite case and belong in RN views.
 *
 * Draws nothing while `font` is `null`. `matchFont` resolves synchronously in
 * practice, but a chart that renders before it would otherwise crash rather
 * than come up a frame late.
 */
export function ChartXAxis({ color, tickPadding = 6, opacity }: ChartXAxisProps): ReactElement | null {
	const { xTicks, xLabels, bounds, font, fontMetrics } = useChartContext();
	if (font === null || xLabels.length === 0) return null;

	return (
		<>
			{xTicks.map((tick, index) => {
				const label = xLabels[index];
				if (label === undefined || label === "" || !Number.isFinite(tick.position)) return null;
				return (
					<Text
						color={color}
						font={font}
						key={`${tick.value}-${label}`}
						opacity={opacity}
						text={label}
						x={anchorX(tick.position, measureLabelWidth(font, label), "middle")}
						y={anchorY(bounds.bottom, fontMetrics, "below", tickPadding)}
					/>
				);
			})}
		</>
	);
}

ChartXAxis.displayName = "DelacourCharts.ChartXAxis";
