import { Rect } from "@shopify/react-native-skia";
import type { ChartBounds, ChartOrientation, ChartScrubState, ChartStep } from "delacour-react-native-charts";
import { ChartCursorLine, useChartContext as useEngineChart } from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { useChart } from "./chart.context";

export type ChartTooltipXProps = {
	/** Overrides the `muted-foreground` token this paints with. */
	color?: string;
	width?: number;
	/** Dash on/off lengths. Pass `null` for a solid rule. */
	dash?: readonly [number, number] | null;
	glide?: boolean;
	opacity?: number;
	/**
	 * A translucent band one step wide instead of a rule.
	 *
	 * On by default when the chart holds bars or candles: a hairline through
	 * the middle of a bar says less than a wash over the whole column. Set it
	 * explicitly to get the band on a line chart, or the rule on a bar chart.
	 */
	band?: boolean;
};

/** Dashed by default, so the crosshair reads as a guide beside solid gridlines. */
const DEFAULT_DASH = [4, 4] as const;

/** A wash, not a fill — the bars under it have to stay legible. */
const BAND_OPACITY = 0.12;

/** Parked off-canvas, so a band with nothing to point at is not at the origin. */
const OFFSCREEN = -10_000;

/**
 * A vertical rule through the scrubbed position — or, over bars, a band.
 *
 * Named for the axis it reads against — it tells you *where along x* you are —
 * rather than for the direction it is drawn in. The band is the same mark in
 * a different width: one `xStep`, centred on the snapped datum, so it picks
 * out the column the readout names. On a horizontal chart the step runs up
 * the category axis, so the band lies across the plot instead.
 */
export function ChartTooltipX({ color, width, dash, glide, opacity, band }: ChartTooltipXProps): ReactElement | null {
	const { axisColor, bars, candlestick } = useChart();
	const paint = color ?? axisColor;
	if (paint === undefined) return null;

	if (band ?? (bars.mode !== "none" || candlestick !== null)) {
		return <ChartTooltipBand color={paint} opacity={opacity ?? BAND_OPACITY} />;
	}

	return (
		<ChartCursorLine
			axis="x"
			color={paint}
			dash={dash === null ? undefined : (dash ?? DEFAULT_DASH)}
			opacity={opacity ?? 0.6}
			snap={glide !== true}
			width={width}
		/>
	);
}

ChartTooltipX.displayName = "DelacourUI.Chart.Tooltip.X";

type ChartTooltipBandProps = {
	readonly color: string;
	readonly opacity: number;
};

/**
 * The band. Reads the engine's context directly, because the scrub's shared
 * values and the step live there; the outer part only decides whether to
 * draw one. Split so a chart with no scrub never runs the derived values.
 */
function ChartTooltipBand(props: ChartTooltipBandProps): ReactElement | null {
	const { scrub, bounds, xStep, orientation } = useEngineChart();
	if (scrub === null) return null;
	return <TooltipBand {...props} bounds={bounds} orientation={orientation} scrub={scrub} step={xStep} />;
}

ChartTooltipBand.displayName = "DelacourUI.Chart.Tooltip.X.Band";

type TooltipBandProps = ChartTooltipBandProps & {
	readonly scrub: ChartScrubState;
	readonly bounds: ChartBounds;
	readonly step: ChartStep;
	readonly orientation: ChartOrientation;
};

/**
 * One rect, `step.px` wide, riding the snapped position on the UI thread the
 * way the engine's cursor line does. Always snapped: a band that glided
 * between columns would highlight half of two bars. The engine reports the
 * category's position on `snappedX` when vertical and `snappedY` when
 * horizontal, and the other is `NaN` — which is why each axis reads its own.
 */
function TooltipBand({ color, opacity, scrub, bounds, step, orientation }: TooltipBandProps): ReactElement {
	const horizontal = orientation === "horizontal";
	const width = horizontal ? bounds.right - bounds.left : step.px;
	const height = horizontal ? step.px : bounds.bottom - bounds.top;

	const x = useDerivedValue(() => {
		if (horizontal) return bounds.left;
		const centre = scrub.snappedX.value;
		return Number.isFinite(centre) ? centre - step.px / 2 : OFFSCREEN;
	});

	const y = useDerivedValue(() => {
		if (!horizontal) return bounds.top;
		const centre = scrub.snappedY.value;
		return Number.isFinite(centre) ? centre - step.px / 2 : OFFSCREEN;
	});

	const alpha = useDerivedValue(() => (scrub.isActive.value ? opacity : 0));

	return <Rect color={color} height={height} opacity={alpha} width={width} x={x} y={y} />;
}

TooltipBand.displayName = "DelacourUI.Chart.Tooltip.X.Band.Inner";
