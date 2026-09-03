import { ChartScatter as EngineScatter } from "delacour-react-native-charts";
import type { ScatterShape } from "delacour-react-native-charts/core";
import type { ReactElement } from "react";
import { useSeriesColor } from "./chart.context";

export type ChartScatterProps = {
	/** Which series to draw. Names a key of the chart's `config`. */
	yKey: string;
	/** Overrides the series' colour from the config. A literal — the canvas can resolve no token. */
	color?: string;
	/** Every point's radius in points. Defaults to 4. */
	radius?: number;
	shape?: ScatterShape;
	opacity?: number;
};

/**
 * One filled shape per datum, in the series' colour.
 *
 * The engine draws a whole series as one path, so a hundred points is one
 * Skia node; a gap is the same shape at radius zero, which is what lets a
 * datum come and go without the series snapping. Rings, per-point radii and
 * the engine's other options are deliberately not surfaced — a scatter on a
 * themed chart is a set of dots, and a chart that needs more reaches for the
 * engine's own mark.
 */
export function ChartScatter({ yKey, color, radius, shape, opacity }: ChartScatterProps): ReactElement | null {
	const resolved = useSeriesColor(yKey);
	const paint = color ?? resolved;
	if (paint === undefined) return null;

	return <EngineScatter color={paint} opacity={opacity} radius={radius} shape={shape} yKey={yKey} />;
}

ChartScatter.displayName = "DelacourUI.Chart.Scatter";
