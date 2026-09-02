import { ChartCursorDot } from "@delacour/charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartTooltipDotProps = {
	/** Which series to mark. Omit to mark every one. */
	yKey?: string;
	/** Overrides the series' colour. */
	color?: string;
	radius?: number;
	/** The ring's width. Zero draws no ring. */
	borderWidth?: number;
	/**
	 * Ride the curve continuously instead of sitting on the nearest datum.
	 *
	 * Off by default: the readout names a datum, so a dot that glides between
	 * them describes a different position from the number beside it.
	 */
	glide?: boolean;
	opacity?: number;
};

/**
 * A dot on each series at the scrubbed position.
 *
 * A Skia mark, so it moves with the plot on the UI thread. It is named under
 * `Chart.Tooltip` because it is part of the same readout, but it is placed as
 * a **sibling** of it rather than a child — the tooltip is a React Native view
 * over the canvas and this is drawn inside it, so one cannot contain the other.
 *
 * The ring takes the chart's background, which is what makes a dot in the
 * series colour legible on a line of that same colour.
 *
 * A series drawn only as a bar gets no dot. A bar has no curve for a dot to
 * sit on — it would float at the bar's top, over a column the tooltip's band
 * already picks out — so the dot follows only the keys some line, area or
 * scatter draws a point for.
 */
export function ChartTooltipDot({
	yKey,
	color,
	radius,
	borderWidth,
	glide,
	opacity,
}: ChartTooltipDotProps): ReactElement {
	const { series, surfaceColor, bars, pointKeys } = useChart();
	const shown = (yKey === undefined ? series : series.filter((entry) => entry.key === yKey)).filter(
		(entry) => !bars.keys.includes(entry.key) || pointKeys.includes(entry.key)
	);

	return (
		<>
			{shown.map((entry) => (
				<ChartCursorDot
					borderColor={borderWidth === 0 ? undefined : surfaceColor}
					borderWidth={borderWidth}
					color={color ?? entry.color}
					key={entry.key}
					opacity={opacity}
					radius={radius}
					snap={glide !== true}
					yKey={entry.key}
				/>
			))}
		</>
	);
}

ChartTooltipDot.displayName = "DelacourUI.Chart.Tooltip.Dot";
