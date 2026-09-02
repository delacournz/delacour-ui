import { Text } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { anchorX, anchorY } from "../../core/text/label-anchor";
import { measureLabelWidth } from "../../skia/font";
import { useChartContext } from "../cartesian-chart.context";

export type ChartYAxisProps = {
	readonly color: string;
	/** Space between the labels and the plot rect. */
	readonly tickPadding?: number;
	readonly side?: "left" | "right";
	readonly opacity?: number;
};

/**
 * Tick labels beside the plot rect.
 *
 * Right-aligned against the plot's left edge, so the labels form a clean
 * column whatever their widths — a left-aligned y axis puts "5" and "1000"
 * on different vertical lines and reads as ragged.
 *
 * Vertically the glyph box is centred on the tick rather than the baseline;
 * `anchorY`'s `middle` is what handles that, and skipping it puts every label
 * a third of a line-height below its own gridline.
 */
export function ChartYAxis({ color, tickPadding = 6, side = "left", opacity }: ChartYAxisProps): ReactElement | null {
	const { yTicks, yLabels, bounds, font, lineHeight } = useChartContext();
	if (font === null || yLabels.length === 0) return null;

	return (
		<>
			{yTicks.map((tick, index) => {
				const label = yLabels[index];
				if (label === undefined || label === "" || !Number.isFinite(tick.position)) return null;
				const width = measureLabelWidth(font, label);
				return (
					<Text
						color={color}
						font={font}
						key={`${tick.value}-${label}`}
						opacity={opacity}
						text={label}
						x={
							side === "left"
								? anchorX(bounds.left - tickPadding, width, "end")
								: anchorX(bounds.right + tickPadding, width, "start")
						}
						y={anchorY(tick.position, lineHeight, "middle")}
					/>
				);
			})}
		</>
	);
}

ChartYAxis.displayName = "DelacourCharts.ChartYAxis";
