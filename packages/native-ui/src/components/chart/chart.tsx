import { CartesianChart, type ChartOrientation, type ScrubConfig, useChartScrub } from "@delacour/charts";
import { type CurveType, resolveXValues } from "@delacour/charts/core";
import { Children, isValidElement, type ReactElement, type ReactNode, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";
import { useThemeColor } from "../../hooks/use-theme-color";
import { type ChartContextValue, ChartProvider } from "./chart.context";
import type {
	ChartAreaSpec,
	ChartBarLayout,
	ChartBarSpec,
	ChartCandlestickKeys,
	ChartConfig,
	ChartDatum,
} from "./chart.types";
import {
	CANDLE_SENTIMENT_TOKENS,
	type ChartSize,
	chartAxisFontSize,
	chartTickCount,
	chartVariants,
	resolveBarLayout,
	resolveBarRadius,
	resolveCategoryTickCount,
	resolveChartKeys,
	resolveChartSeries,
	resolveDomainDefaults,
	resolveStackedAreaKeys,
	resolveXValueFormat,
} from "./chart.variants";
import { ChartArea, type ChartAreaProps } from "./chart-area";
import { ChartBar, type ChartBarProps } from "./chart-bar";
import { ChartBars } from "./chart-bars";
import { ChartCandlestick, type ChartCandlestickProps, candlestickKeysOf } from "./chart-candlestick";
import { ChartGrid } from "./chart-grid";
import { ChartLegend } from "./chart-legend";
import { ChartLine, type ChartLineProps } from "./chart-line";
import { ChartScatter, type ChartScatterProps } from "./chart-scatter";
import { ChartTooltip } from "./chart-tooltip";
import { ChartTooltipDot } from "./chart-tooltip-dot";
import { ChartTooltipX } from "./chart-tooltip-x";
import { ChartTooltipY } from "./chart-tooltip-y";
import { ChartXAxis } from "./chart-x-axis";
import { ChartYAxis } from "./chart-y-axis";
import { useChartFont } from "./use-chart-font";
import { useChartPalette } from "./use-chart-palette";

export type ChartProps = {
	/** The series, keyed by the data field each reads. Key order is draw order. */
	config: ChartConfig;
	data: readonly ChartDatum[];
	/** The field every series is plotted against. */
	xKey: string;
	/** Show only these series. Defaults to every key of `config`. */
	yKeys?: readonly string[];
	size?: ChartSize;
	/** The interpolator every mark uses unless it overrides it. */
	curve?: CurveType;
	/** Explicit y bounds. Either end may be omitted to keep the data's own. */
	domain?: { y?: readonly [number | undefined, number | undefined] };
	/** Pull zero into the y domain. Defaults on when the chart holds bars. */
	includeZero?: boolean;
	/**
	 * Categories along x (the default) or along y.
	 *
	 * `horizontal` swaps the axis roles, so bars grow rightward from a category
	 * axis on the left. `Chart.XAxis` and `Chart.YAxis` keep their names — they
	 * label the axis they sit beside, whichever field it now carries.
	 */
	orientation?: ChartOrientation;
	/** How the scrub coexists with a scrolling parent. Defaults to holding. */
	scrubConfig?: ScrubConfig;
	className?: string;
	/** Named on the frame, so a capture flow or a test can find the plot. */
	testID?: string;
	children?: ReactNode;
};

/** Parts that draw into the canvas. Everything else is layered around it. */
const CANVAS_PARTS = new Set<unknown>([
	ChartGrid,
	ChartLine,
	ChartArea,
	ChartBar,
	ChartScatter,
	ChartCandlestick,
	ChartXAxis,
	ChartYAxis,
	// The cursor marks are named under `Chart.Tooltip` but drawn in the canvas,
	// not inside the view the tooltip renders.
	ChartTooltipDot,
	ChartTooltipX,
	ChartTooltipY,
]);

function ChartRoot({
	config,
	data,
	xKey,
	yKeys,
	size = "md",
	curve = "monotone",
	domain,
	includeZero,
	orientation = "vertical",
	scrubConfig,
	className,
	testID,
	children,
}: ChartProps): ReactElement {
	const slots = chartVariants({ size });
	const [frame, setFrame] = useState({ width: 0, height: 0 });

	const declared = useMemo(() => resolveChartSeries(config, yKeys), [config, yKeys]);
	const { canvas, overlay, axes, bars, stackedAreaKeys, candlestick, pointKeys, scatter } = useMemo(
		() => partitionChildren(children),
		[children]
	);

	// Every theme lookup happens here, above the canvas. Skia's renderer is a
	// second React reconciler with no Uniwind provider in it, so a hook called
	// inside would resolve nothing — the marks receive resolved strings instead.
	// The series palette goes through `useChartPalette`, which holds the eight
	// fixed `useThemeColor` slots the ramp resolves into.
	const series = useChartPalette(declared);
	const gridColor = useThemeColor("border");
	const axisColor = useThemeColor("muted-foreground");
	const surfaceColor = useThemeColor("background");

	// The three candle sentiments, as three fixed calls — the same reason the
	// palette hook writes its eight out. Only literal overrides are accepted
	// on the part, so nothing else has to be resolved here.
	const candlePositive = useThemeColor(CANDLE_SENTIMENT_TOKENS.positive);
	const candleNegative = useThemeColor(CANDLE_SENTIMENT_TOKENS.negative);
	const candleNeutral = useThemeColor(CANDLE_SENTIMENT_TOKENS.neutral);
	const candleColors = useMemo(
		() => ({
			positive: candlePositive ?? CANDLE_SENTIMENT_TOKENS.positive,
			negative: candleNegative ?? CANDLE_SENTIMENT_TOKENS.negative,
			neutral: candleNeutral ?? CANDLE_SENTIMENT_TOKENS.neutral,
		}),
		[candlePositive, candleNegative, candleNeutral]
	);

	// `--radius` is the only step of the corner scale that survives to runtime,
	// so a bar's corner is computed from the base — see `resolveBarRadius`.
	const radius = (useCSSVariable("--radius") as number | undefined) ?? 0;
	const barRadius = resolveBarRadius(size, radius);

	// The engine plots every series plus the candle's other three fields; the
	// scrub follows the same list so a candle key has a value to read.
	const keys = useMemo(
		() =>
			resolveChartKeys(
				series.map((entry) => entry.key),
				candlestick
			),
		[series, candlestick]
	);
	const stackKeys = bars.mode === "stacked" ? bars.keys : stackedAreaKeys;
	const scrub = useChartScrub(keys);
	const font = useChartFont(chartAxisFontSize(size));

	const formatXValue = useMemo(() => resolveXValueFormat(data, xKey), [data, xKey]);
	// Only a categorical x has one label per row to protect; a numeric or a
	// time axis is a scale, and its ticks stay a budget.
	const categoryCount = useMemo(() => (resolveXValues(data, xKey).isCategorical ? data.length : 0), [data, xKey]);

	const value = useMemo<ChartContextValue>(
		() => ({
			series,
			data,
			xKey,
			formatXValue,
			size,
			slots,
			gridColor,
			axisColor,
			surfaceColor,
			scrub,
			frame,
			bars,
			barRadius,
			candlestick,
			candleColors,
			pointKeys,
			orientation,
		}),
		[
			series,
			data,
			xKey,
			formatXValue,
			size,
			slots,
			gridColor,
			axisColor,
			surfaceColor,
			scrub,
			frame,
			bars,
			barRadius,
			candlestick,
			candleColors,
			pointKeys,
			orientation,
		]
	);

	const onLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setFrame((current) => (current.width === width && current.height === height ? current : { width, height }));
	};

	// A bar or a candle owns a band; the tooltip's band and the category tick
	// count key on that. What the domain needs — zero pulled in for bars, the
	// data's own extent for candles, half a step of x for anything centred on
	// its datum — is `resolveDomainDefaults`' call.
	const hasBands = bars.mode !== "none" || candlestick !== null;
	const domainDefaults = resolveDomainDefaults({ bars, candlestick, scatter, includeZero, domain });

	// The category axis labels every bar; the value axis keeps the size's
	// budget. Which axis is which follows the orientation — the engine puts
	// the categories on y when horizontal.
	const tickCount = chartTickCount(size);
	const categoryTickCount = resolveCategoryTickCount(size, categoryCount, hasBands);
	const xTickCount = orientation === "horizontal" ? tickCount : categoryTickCount;
	const yTickCount = orientation === "horizontal" ? categoryTickCount : tickCount;

	return (
		<ChartProvider value={value}>
			<View className={slots.root({ className })}>
				<View className={slots.frame()} onLayout={onLayout} testID={testID}>
					<CartesianChart
						curve={curve}
						data={data}
						domain={domain}
						domainPadding={domainDefaults.domainPadding}
						font={font}
						includeZero={domainDefaults.includeZero}
						niceDomain
						orientation={orientation}
						scrub={scrub}
						scrubConfig={scrubConfig}
						stackKeys={stackKeys.length === 0 ? undefined : stackKeys}
						xAxis={{ show: axes.x, tickCount: xTickCount }}
						xKey={xKey}
						yAxis={{ show: axes.y, tickCount: yTickCount }}
						yKeys={keys}
					>
						<ChartProvider value={value}>{canvas}</ChartProvider>
					</CartesianChart>
					{overlay.canvasOverlay}
				</View>
				{overlay.below}
			</View>
		</ChartProvider>
	);
}

/**
 * Splits the children by where they have to be mounted.
 *
 * Marks go inside the Skia canvas; a tooltip is absolutely positioned over it;
 * a legend sits under it. The caller writes all three as siblings because that
 * is how a chart reads, and the root puts each where it belongs.
 *
 * It also reports which axes were placed, and that is not bookkeeping: an axis
 * gutter is reserved from the *measured width of its labels*, so a chart with
 * no `Chart.YAxis` would otherwise inset its plot by the width of labels it
 * never draws. On a chart inside a card that reads as the plot failing to line
 * up with the text above it, with nothing on screen to explain the gap.
 *
 * The bars are the other thing it has to see whole. A `Chart.Bar` cannot
 * know how many siblings share its step, so every bar's props are collected,
 * resolved into one layout, and drawn by a single internal `ChartBars`
 * spliced in where the first bar stood — the later ones are dropped from the
 * canvas list. Stacked areas and the candlestick's field names are read the
 * same way, because the engine's `stackKeys` and `yKeys` are root props.
 *
 * Matching is by component identity, the same technique `Spinner` uses on its
 * own children. The limit that comes with it: a part has to be a **direct**
 * child of `<Chart>`. An array from `.map()` is fine — `Children.toArray`
 * flattens it — but a mark wrapped in a caller's own component is not, because
 * there is nothing to match against until it renders.
 */
function partitionChildren(children: ReactNode): ChartPartition {
	const collected: PartitionState = {
		canvas: [],
		canvasOverlay: [],
		below: [],
		axes: { x: false, y: false },
		barProps: [],
		areaSpecs: [],
		pointKeys: [],
		candlestick: null,
		barsAt: -1,
		scatter: false,
	};

	for (const child of Children.toArray(children)) {
		if (isValidElement(child)) collectChild(child, collected);
	}

	const { canvas, canvasOverlay, below, axes, barProps, areaSpecs, pointKeys, candlestick, barsAt, scatter } =
		collected;
	const bars = resolveBarLayout(barProps.map(barSpecOf));
	if (barsAt !== -1) canvas.splice(barsAt, 0, <ChartBars bars={barProps} key="bars" />);

	return {
		canvas,
		overlay: { canvasOverlay, below },
		axes,
		bars,
		stackedAreaKeys: resolveStackedAreaKeys(areaSpecs, bars),
		candlestick,
		pointKeys,
		scatter,
	};
}

type ChartPartition = {
	canvas: ReactNode[];
	overlay: { canvasOverlay: ReactNode[]; below: ReactNode[] };
	axes: { x: boolean; y: boolean };
	bars: ChartBarLayout;
	stackedAreaKeys: readonly string[];
	candlestick: ChartCandlestickKeys | null;
	pointKeys: readonly string[];
	/** Whether any `Chart.Scatter` is placed — its outermost dots need the x padding bars get. */
	scatter: boolean;
};

type PartitionState = {
	canvas: ReactNode[];
	canvasOverlay: ReactNode[];
	below: ReactNode[];
	axes: { x: boolean; y: boolean };
	barProps: ChartBarProps[];
	areaSpecs: ChartAreaSpec[];
	pointKeys: string[];
	candlestick: ChartCandlestickKeys | null;
	barsAt: number;
	scatter: boolean;
};

/** Files one child by identity. A bar is recorded and not placed — `ChartBars` stands in for all of them. */
function collectChild(child: ReactElement, state: PartitionState): void {
	if (child.type === ChartXAxis) state.axes.x = true;
	if (child.type === ChartYAxis) state.axes.y = true;

	if (child.type === ChartBar) {
		state.barProps.push(child.props as ChartBarProps);
		if (state.barsAt === -1) state.barsAt = state.canvas.length;
		return;
	}
	if (child.type === ChartArea) state.areaSpecs.push(child.props as ChartAreaProps);
	if (child.type === ChartCandlestick && state.candlestick === null) {
		state.candlestick = candlestickKeysOf(child.props as ChartCandlestickProps);
	}
	if (child.type === ChartScatter) state.scatter = true;
	if (child.type === ChartLine || child.type === ChartArea || child.type === ChartScatter) {
		state.pointKeys.push((child.props as ChartLineProps | ChartAreaProps | ChartScatterProps).yKey);
	}

	if (CANVAS_PARTS.has(child.type)) state.canvas.push(child);
	else if (child.type === ChartTooltip) state.canvasOverlay.push(child);
	else state.below.push(child);
}

/** The part of a bar's props the layout reads. */
function barSpecOf(props: ChartBarProps): ChartBarSpec {
	return props.stackId === undefined ? { yKey: props.yKey } : { yKey: props.yKey, stackId: props.stackId };
}

/**
 * Skia charts, wearing the theme's five-colour series ramp.
 *
 * The `config` is the chart: it names each series, decides the draw order, and
 * assigns the ramp by position, so `<Chart.Line yKey="desktop" />` names the
 * data and never the paint. Its shape is shadcn's on purpose — a chart config
 * written for a web dashboard moves across as a copy rather than a translation.
 *
 * Parts are placed, not configured. `Chart.Grid`, `Chart.Line`, `Chart.Area`,
 * `Chart.Bar`, `Chart.Scatter`, `Chart.Candlestick`, `Chart.XAxis` and
 * `Chart.YAxis` draw into the canvas; `Chart.Tooltip` floats over it and
 * `Chart.Legend` sits beneath, both as ordinary React Native views so they can
 * carry the type scale and a colour token. Sibling bars group; bars sharing a
 * `stackId` stack, and so do areas.
 *
 * A colour may be a theme token or a literal — `lib/color`'s `isLiteralColor`
 * tells them apart, so `color: "#EC4899"` works beside `color: "chart-4"` with
 * no special-casing at the call site. At most eight *distinct* tokens can be
 * resolved in one render; past that, give the extras literals.
 *
 * Touch is opt-in through the parts: without a `Chart.Tooltip` the chart takes
 * a scrub but nothing shows it. The scrub activates on a hold by default, so a
 * chart inside a scrolling list does not steal the scroll.
 *
 * @example
 * <Chart config={{ revenue: { label: "Revenue" } }} data={rows} xKey="month">
 *   <Chart.Grid />
 *   <Chart.YAxis />
 *   <Chart.XAxis />
 *   <Chart.Area yKey="revenue" />
 *   <Chart.Line yKey="revenue" />
 * </Chart>
 *
 * @example
 * <Chart config={config} data={rows} size="lg" xKey="month">
 *   <Chart.Line yKey="desktop" />
 *   <Chart.Line yKey="mobile" />
 *   <Chart.Tooltip />
 *   <Chart.Legend />
 * </Chart>
 *
 * @example
 * <Chart config={config} data={rows} xKey="month">
 *   <Chart.Bar stackId="traffic" yKey="desktop" />
 *   <Chart.Bar stackId="traffic" yKey="mobile" />
 *   <Chart.Tooltip.X />
 *   <Chart.Tooltip />
 * </Chart>
 */
export const Chart = Object.assign(ChartRoot, {
	/** A hairline rule at each tick, painted with `border`. Draws first, under every mark. */
	Grid: ChartGrid,
	/** A stroked line through one series, in that series' colour. */
	Line: ChartLine,
	/** The region under one series, fading out towards the baseline. `stackId` stacks it. */
	Area: ChartArea,
	/** One bar per datum. Siblings group; a shared `stackId` stacks. */
	Bar: ChartBar,
	/** One dot per datum, in the series' colour. */
	Scatter: ChartScatter,
	/** Open-high-low-close candles in `success`, `destructive` and `muted-foreground`. */
	Candlestick: ChartCandlestick,
	/** Tick labels below the plot, in `muted-foreground`. */
	XAxis: ChartXAxis,
	/** Tick labels beside the plot, right-aligned into a column. */
	YAxis: ChartYAxis,
	/** A floating readout that follows the scrub. A React Native view, over the canvas. */
	Tooltip: ChartTooltip,
	/** A swatch and a label per series, under the chart. */
	Legend: ChartLegend,
	displayName: "DelacourUI.Chart",
});
