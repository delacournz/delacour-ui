import { ChartCursorLine } from "@delacour/charts";
import type { ReactElement } from "react";
import { useChart } from "./chart.context";

export type ChartTooltipXProps = {
	/** Overrides the `muted-foreground` token this paints with. */
	color?: string;
	width?: number;
	/** Dash on/off lengths. Pass `null` for a solid rule. */
	dash?: readonly [number, number] | null;
	glide?: boolean;
	opacity?: number;
};

/** Dashed by default, so the crosshair reads as a guide beside solid gridlines. */
const DEFAULT_DASH = [4, 4] as const;

/**
 * A vertical rule through the scrubbed position.
 *
 * Named for the axis it reads against — it tells you *where along x* you are —
 * rather than for the direction it is drawn in.
 */
export function ChartTooltipX({ color, width, dash, glide, opacity = 0.6 }: ChartTooltipXProps): ReactElement | null {
	const { axisColor } = useChart();
	const paint = color ?? axisColor;
	if (paint === undefined) return null;

	return (
		<ChartCursorLine
			axis="x"
			color={paint}
			dash={dash === null ? undefined : (dash ?? DEFAULT_DASH)}
			opacity={opacity}
			snap={glide !== true}
			width={width}
		/>
	);
}

ChartTooltipX.displayName = "DelacourUI.Chart.Tooltip.X";
