import { type ChartBarLabels, ChartBar as EngineBar } from "@delacour/charts";
import type { ChartPoint, CornerRadii } from "@delacour/charts/core";
import type { ReactElement } from "react";
import { useChart, useSeriesColor } from "./chart.context";
import type { ChartDatum } from "./chart.types";

export type ChartBarProps = {
	/** Which series to draw. Names a key of the chart's `config`. */
	yKey: string;
	/**
	 * Stack this bar on every sibling that names the same id.
	 *
	 * Sibling bars without one sit side by side within each step. One stack
	 * per chart: a second id, or a stack beside a loose bar, throws by name.
	 */
	stackId?: string;
	/** Overrides the series' colour from the config. A literal — the canvas can resolve no token. */
	color?: string;
	/**
	 * Round the value end. On by default, following `--radius` at the chart's
	 * size; `false` is square and a number is an exact radius in points.
	 */
	rounded?: boolean | number;
	/**
	 * Print each value against its bar.
	 *
	 * `true` prints the value as written; a function receives the value and
	 * its row and returns the text, `""` to skip that bar. Drawn in the axis
	 * colour with the axis font. A grouped or stacked chart draws no labels —
	 * there is no room between the bars for them to read.
	 */
	labels?: boolean | ((value: number, row: ChartDatum) => string);
	opacity?: number;
};

/**
 * One bar per datum for one series, standing on zero.
 *
 * Placed as a direct child of `<Chart>`, it never renders itself: the root
 * collects every `Chart.Bar`, lays them out together — grouped by being
 * siblings, stacked by `stackId` — and draws them through one internal
 * `Chart.Bars` in the first bar's place. That is what lets two bars know
 * they share a step before either has rendered.
 *
 * Reached any other way — wrapped in a caller's own component, say — it
 * draws a single engine bar in its series' colour. It degrades to "not
 * grouped" rather than to nothing, but it cannot know its siblings, so a
 * wrapped bar never groups or stacks. See AGENTS.md.
 */
export function ChartBar({ yKey, color, rounded, labels, opacity }: ChartBarProps): ReactElement | null {
	const { barRadius, axisColor, data } = useChart();
	const resolved = useSeriesColor(yKey);
	const paint = color ?? resolved;
	if (paint === undefined) return null;

	return (
		<EngineBar
			color={paint}
			labels={resolveBarLabels(labels, axisColor, data)}
			opacity={opacity}
			roundedCorners={barCorners(barRadiusFor(rounded, barRadius))}
			yKey={yKey}
		/>
	);
}

ChartBar.displayName = "DelacourUI.Chart.Bar";

/** The value end's two corners at one radius. The base stays square. */
export function barCorners(radius: number): CornerRadii {
	return { topLeft: radius, topRight: radius };
}

/**
 * A bar's own `rounded` against the chart's resolved radius.
 *
 * The context already holds `--radius` × the size multiplier, so this only
 * has to honour `false` and a number. `resolveBarRadius` does the same in
 * the root, where `--radius` is readable; this runs where a part is not.
 */
export function barRadiusFor(rounded: boolean | number | undefined, barRadius: number): number {
	if (rounded === false) return 0;
	if (typeof rounded === "number") return Number.isFinite(rounded) ? Math.max(0, rounded) : 0;
	return barRadius;
}

/** The engine's label options for a `labels` prop, or nothing. */
export function resolveBarLabels(
	labels: ChartBarProps["labels"],
	color: string | undefined,
	data: readonly ChartDatum[]
): ChartBarLabels | undefined {
	if (labels === undefined || labels === false || color === undefined) return undefined;
	if (labels === true) return { color };
	const format = labels;
	return {
		color,
		formatLabel: (point: ChartPoint, index: number): string => {
			const row = data[index];
			return point.yValue === null || row === undefined ? "" : format(point.yValue, row);
		},
	};
}
