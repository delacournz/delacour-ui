import { Path, Skia } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import { type GridAxis, gridSegments } from "../../core/geometry/grid-lines";
import { useChartContext } from "../cartesian-chart.context";

export type ChartGridProps = {
	/** Which ticks get a rule. Defaults to the y ticks alone. */
	readonly axis?: GridAxis;
	readonly color: string;
	readonly lineWidth?: number;
	readonly opacity?: number;
	/** Dash on/off lengths, in points. */
	readonly dash?: readonly [number, number];
};

/**
 * A hairline rule at each tick.
 *
 * Every rule is one path rather than one `<Path>` per line: a chart with two
 * axes and eight ticks each is sixteen Skia nodes for something that is a
 * single stroke, and the node count is what a Skia tree costs.
 *
 * `y` alone by default. Horizontal rules let a reader carry a value across to
 * the axis, which is what a gridline is for; vertical ones mostly repeat what
 * the marks already show.
 */
export function ChartGrid({ axis = "y", color, lineWidth = 1, opacity, dash }: ChartGridProps): ReactElement {
	const { xTicks, yTicks, bounds } = useChartContext();

	const path = useMemo(() => {
		// `Skia.PathBuilder`, not `Skia.Path.Make()` — the mutating methods on
		// `SkPath` are deprecated in Skia 2.x and warn on every construction.
		const builder = Skia.PathBuilder.Make();
		for (const [x1, y1, x2, y2] of gridSegments({ bounds, xTicks, yTicks, axis })) {
			builder.moveTo(x1, y1);
			builder.lineTo(x2, y2);
		}
		const built = builder.build();
		if (dash === undefined) return built;
		return Skia.Path.Dash(built, dash[0], dash[1], 0) ?? built;
	}, [axis, xTicks, yTicks, bounds, dash]);

	return <Path color={color} opacity={opacity} path={path} strokeWidth={lineWidth} style="stroke" />;
}

ChartGrid.displayName = "DelacourCharts.ChartGrid";
