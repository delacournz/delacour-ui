import { Circle, DashPathEffect, Line } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { useDerivedValue } from "react-native-reanimated";
import type { ChartBounds } from "../../core/chart.types";
import type { ChartScrubSeriesState, ChartScrubState } from "../../gesture/gesture.types";
import { useChartContext } from "../cartesian-chart.context";

/** Parked off-canvas, so a mark with nothing to point at is not at the origin. */
const OFFSCREEN = -10_000;

export type ChartCursorDotProps = {
	/** Which series the dot rides. */
	readonly yKey: string;
	readonly color: string;
	readonly radius?: number;
	/**
	 * A ring around the dot, usually the chart's own background.
	 *
	 * Without it a dot in the series colour sitting on a line of the same colour
	 * is a slight thickening and nothing more.
	 */
	readonly borderColor?: string;
	readonly borderWidth?: number;
	/**
	 * Sit on the nearest datum rather than gliding along the curve.
	 *
	 * On by default, because the readout beside it names a datum. Turn it off
	 * for a dot that tracks the finger continuously, and expect it to disagree
	 * with any label showing a measured value.
	 */
	readonly snap?: boolean;
	readonly opacity?: number;
};

/**
 * A dot marking where a scrub has reached, on one series.
 *
 * The outer component reads the chart and bails when there is no scrub to
 * follow; the inner one is where the hooks live, so a chart with no scrub
 * never runs them. Splitting it is what keeps the hook order fixed — a
 * component that called `useDerivedValue` after a conditional return would
 * break the moment a chart gained or lost its scrub.
 *
 * It reads the series' own `snappedX`/`snappedY`, which the scrub fills in
 * for either orientation, so the dot lands on the bar's end on a horizontal
 * chart without this component knowing there is such a thing.
 */
export function ChartCursorDot(props: ChartCursorDotProps): ReactElement | null {
	const { scrub } = useChartContext();
	const series = scrub?.series[props.yKey];
	if (!scrub || !series) return null;
	return <CursorDot {...props} scrub={scrub} series={series} />;
}

ChartCursorDot.displayName = "DelacourCharts.ChartCursorDot";

function CursorDot({
	color,
	radius = 4,
	borderColor,
	borderWidth = 2,
	snap = true,
	opacity,
	scrub,
	series,
}: ChartCursorDotProps & {
	readonly scrub: ChartScrubState;
	readonly series: ChartScrubSeriesState;
}): ReactElement {
	const cx = useDerivedValue(() => {
		const value = snap ? series.snappedX.value : series.x.value;
		return Number.isFinite(value) ? value : OFFSCREEN;
	});

	const cy = useDerivedValue(() => {
		const value = snap ? series.snappedY.value : series.y.value;
		return Number.isFinite(value) ? value : OFFSCREEN;
	});

	const alpha = useDerivedValue(() => (scrub.isActive.value ? (opacity ?? 1) : 0));

	return (
		<>
			{borderColor === undefined ? null : (
				<Circle color={borderColor} cx={cx} cy={cy} opacity={alpha} r={radius + borderWidth} />
			)}
			<Circle color={color} cx={cx} cy={cy} opacity={alpha} r={radius} />
		</>
	);
}

CursorDot.displayName = "DelacourCharts.ChartCursorDot.Inner";

export type ChartCursorLineProps = {
	/**
	 * `x` is a vertical rule; `y` is a horizontal one. Named for the axis the
	 * line reads against, not for the direction it is drawn in.
	 *
	 * Without a `yKey` the rule sits at the touched category — under the
	 * finger on a vertical chart for `x`, beside it on a horizontal chart for
	 * `y`. With one, it sits at that series' nearest datum on that axis.
	 */
	readonly axis: "x" | "y";
	/** Which series the rule sits at. Without it the rule follows the category. */
	readonly yKey?: string;
	readonly color: string;
	readonly width?: number;
	/** Dash on/off lengths. A dashed rule reads as a guide beside solid gridlines. */
	readonly dash?: readonly [number, number];
	readonly snap?: boolean;
	readonly opacity?: number;
};

/** A crosshair rule spanning the plot at the scrubbed position. */
export function ChartCursorLine(props: ChartCursorLineProps): ReactElement | null {
	const { scrub, bounds } = useChartContext();
	const series = props.yKey === undefined ? undefined : scrub?.series[props.yKey];
	if (!scrub) return null;
	if (props.yKey !== undefined && !series) return null;
	return <CursorLine {...props} bounds={bounds} scrub={scrub} series={series} />;
}

ChartCursorLine.displayName = "DelacourCharts.ChartCursorLine";

function CursorLine({
	axis,
	color,
	width = 1,
	dash,
	snap = true,
	opacity,
	bounds,
	scrub,
	series,
}: ChartCursorLineProps & {
	readonly bounds: ChartBounds;
	readonly scrub: ChartScrubState;
	readonly series: ChartScrubSeriesState | undefined;
}): ReactElement {
	const at = (): number => {
		"worklet";
		const source = series ?? scrub;
		if (axis === "x") return snap ? source.snappedX.value : source.x.value;
		return snap ? source.snappedY.value : source.y.value;
	};

	const p1 = useDerivedValue(() => {
		const value = at();
		const position = Number.isFinite(value) ? value : OFFSCREEN;
		return axis === "x" ? { x: position, y: bounds.top } : { x: bounds.left, y: position };
	});

	const p2 = useDerivedValue(() => {
		const value = at();
		const position = Number.isFinite(value) ? value : OFFSCREEN;
		return axis === "x" ? { x: position, y: bounds.bottom } : { x: bounds.right, y: position };
	});

	const alpha = useDerivedValue(() => (scrub.isActive.value ? (opacity ?? 1) : 0));

	return (
		<Line color={color} opacity={alpha} p1={p1} p2={p2} strokeWidth={width} style="stroke">
			{dash === undefined ? null : <DashPathEffect intervals={[dash[0], dash[1]]} />}
		</Line>
	);
}

CursorLine.displayName = "DelacourCharts.ChartCursorLine.Inner";
