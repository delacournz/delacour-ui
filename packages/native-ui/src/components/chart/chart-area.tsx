import { ChartArea as EngineArea } from "@delacour/charts";
import type { CurveType } from "@delacour/charts/core";
import type { ReactElement } from "react";
import { useSeriesColor } from "./chart.context";

export type ChartAreaProps = {
	yKey: string;
	color?: string;
	curve?: CurveType;
	connectMissingData?: boolean;
	/**
	 * Fade the fill out towards the baseline instead of painting it flat.
	 *
	 * On by default: a flat fill at any readable opacity competes with the line
	 * it sits under, and at an unreadable one it may as well not be there.
	 */
	gradient?: boolean;
	/** Opacity at the top of the fill. The bottom is always transparent. */
	opacity?: number;
};

/** How much of the series colour a fill starts with, before fading out. */
const DEFAULT_FILL_OPACITY = 0.25;

/**
 * The region under a series, in that series' colour.
 *
 * The fade is built from the resolved colour rather than from an opacity prop
 * on the whole mark, so the top of the fill keeps the series' hue at reduced
 * strength and the bottom reaches genuine transparency. Fading the node instead
 * would leave a visible flat edge along the baseline.
 */
export function ChartArea({
	yKey,
	color,
	curve,
	connectMissingData,
	gradient = true,
	opacity = DEFAULT_FILL_OPACITY,
}: ChartAreaProps): ReactElement | null {
	const resolved = useSeriesColor(yKey);
	const paint = color ?? resolved;
	if (paint === undefined) return null;

	if (!gradient) {
		return (
			<EngineArea color={paint} connectMissingData={connectMissingData} curve={curve} opacity={opacity} yKey={yKey} />
		);
	}

	return (
		<EngineArea
			connectMissingData={connectMissingData}
			curve={curve}
			gradient={[paint, "transparent"]}
			opacity={opacity}
			yKey={yKey}
		/>
	);
}

ChartArea.displayName = "DelacourUI.Chart.Area";
