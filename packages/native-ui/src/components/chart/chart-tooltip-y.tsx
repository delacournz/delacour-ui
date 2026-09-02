import { ChartCursorLine } from "@delacour/charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartTooltipYProps = {
	/** Which series' value the rule sits at. Defaults to the first. */
	yKey?: string;
	/** Overrides the series' colour. */
	color?: string;
	width?: number;
	/** Dash on/off lengths. Pass `null` for a solid rule. */
	dash?: readonly [number, number] | null;
	glide?: boolean;
	opacity?: number;
};

const DEFAULT_DASH = [4, 4] as const;

/**
 * A horizontal rule at one series' scrubbed value.
 *
 * It carries the value across to the y axis, which is the same job a gridline
 * does — so it takes the series' own colour rather than the axis', to say
 * *which* series it is reading.
 *
 * One series only. Drawing a rule per series would put four horizontal lines
 * across a four-series chart, and the reader would have to work out which
 * belonged to which.
 */
export function ChartTooltipY({
	yKey,
	color,
	width,
	dash,
	glide,
	opacity = 0.6,
}: ChartTooltipYProps): ReactElement | null {
	const { series } = useChart();
	const target = yKey === undefined ? series[0] : series.find((entry) => entry.key === yKey);
	if (target === undefined) return null;

	return (
		<ChartCursorLine
			axis="y"
			color={color ?? target.color}
			dash={dash === null ? undefined : (dash ?? DEFAULT_DASH)}
			opacity={opacity}
			snap={glide !== true}
			width={width}
			yKey={target.key}
		/>
	);
}

ChartTooltipY.displayName = "DelacourUI.Chart.Tooltip.Y";
