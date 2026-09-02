import { CartesianChart, type ScrubConfig, useChartScrub } from "@delacour/charts";
import type { CurveType } from "@delacour/charts/core";
import { Children, isValidElement, type ReactElement, type ReactNode, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { useThemeColor } from "../../hooks/use-theme-color";
import { type ChartContextValue, ChartProvider } from "./chart.context";
import type { ChartConfig, ChartDatum } from "./chart.types";
import {
	applyChartColors,
	CHART_MAX_TOKEN_SERIES,
	type ChartSize,
	chartAxisFontSize,
	chartTickCount,
	chartVariants,
	partitionChartColors,
	resolveChartSeries,
	resolveXValueFormat,
} from "./chart.variants";
import { ChartArea } from "./chart-area";
import { ChartGrid } from "./chart-grid";
import { ChartLegend } from "./chart-legend";
import { ChartLine } from "./chart-line";
import { ChartTooltip } from "./chart-tooltip";
import { ChartTooltipDot } from "./chart-tooltip-dot";
import { ChartTooltipX } from "./chart-tooltip-x";
import { ChartTooltipY } from "./chart-tooltip-y";
import { ChartXAxis } from "./chart-x-axis";
import { ChartYAxis } from "./chart-y-axis";
import { useChartFont } from "./use-chart-font";

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
	/** Pull zero into the y domain. */
	includeZero?: boolean;
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
	scrubConfig,
	className,
	testID,
	children,
}: ChartProps): ReactElement {
	const slots = chartVariants({ size });
	const [frame, setFrame] = useState({ width: 0, height: 0 });

	const declared = useMemo(() => resolveChartSeries(config, yKeys), [config, yKeys]);
	const partition = useMemo(() => partitionChartColors(declared, CHART_MAX_TOKEN_SERIES), [declared]);

	// Every theme lookup happens here, above the canvas. Skia's renderer is a
	// second React reconciler with no Uniwind provider in it, so a hook called
	// inside would resolve nothing — the marks receive resolved strings instead.
	//
	// Eight calls, written out. `partitionChartColors` pads its token list to
	// exactly this many so the hook count cannot vary between renders, and a
	// loop over the series would break the rules of hooks the moment a series
	// was added. The repetition is the mechanism, not an oversight.
	const color0 = useThemeColor(partition.tokens[0] as string);
	const color1 = useThemeColor(partition.tokens[1] as string);
	const color2 = useThemeColor(partition.tokens[2] as string);
	const color3 = useThemeColor(partition.tokens[3] as string);
	const color4 = useThemeColor(partition.tokens[4] as string);
	const color5 = useThemeColor(partition.tokens[5] as string);
	const color6 = useThemeColor(partition.tokens[6] as string);
	const color7 = useThemeColor(partition.tokens[7] as string);
	const gridColor = useThemeColor("border");
	const axisColor = useThemeColor("muted-foreground");
	const surfaceColor = useThemeColor("background");

	const series = useMemo(
		() => applyChartColors(declared, partition, [color0, color1, color2, color3, color4, color5, color6, color7]),
		[declared, partition, color0, color1, color2, color3, color4, color5, color6, color7]
	);

	const keys = useMemo(() => series.map((entry) => entry.key), [series]);
	const scrub = useChartScrub(keys);
	const font = useChartFont(chartAxisFontSize(size));

	const formatXValue = useMemo(() => resolveXValueFormat(data, xKey), [data, xKey]);

	const value = useMemo<ChartContextValue>(
		() => ({ series, data, xKey, formatXValue, size, slots, gridColor, axisColor, surfaceColor, scrub, frame }),
		[series, data, xKey, formatXValue, size, slots, gridColor, axisColor, surfaceColor, scrub, frame]
	);

	const { canvas, overlay } = useMemo(() => partitionChildren(children), [children]);

	const onLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setFrame((current) => (current.width === width && current.height === height ? current : { width, height }));
	};

	const tickCount = chartTickCount(size);

	return (
		<ChartProvider value={value}>
			<View className={slots.root({ className })}>
				<View className={slots.frame()} onLayout={onLayout} testID={testID}>
					<CartesianChart
						curve={curve}
						data={data}
						domain={domain}
						font={font}
						includeZero={includeZero}
						niceDomain
						scrub={scrub}
						scrubConfig={scrubConfig}
						xAxis={{ tickCount }}
						xKey={xKey}
						yAxis={{ tickCount }}
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
 * Matching is by component identity, the same technique `Spinner` uses on its
 * own children. The limit that comes with it: a part has to be a **direct**
 * child of `<Chart>`. An array from `.map()` is fine — `Children.toArray`
 * flattens it — but a mark wrapped in a caller's own component is not, because
 * there is nothing to match against until it renders.
 */
function partitionChildren(children: ReactNode): {
	canvas: ReactNode[];
	overlay: { canvasOverlay: ReactNode[]; below: ReactNode[] };
} {
	const canvas: ReactNode[] = [];
	const canvasOverlay: ReactNode[] = [];
	const below: ReactNode[] = [];

	for (const child of Children.toArray(children)) {
		if (!isValidElement(child)) continue;
		if (CANVAS_PARTS.has(child.type)) canvas.push(child);
		else if (child.type === ChartTooltip) canvasOverlay.push(child);
		else below.push(child);
	}

	return { canvas, overlay: { canvasOverlay, below } };
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
 * `Chart.XAxis` and `Chart.YAxis` draw into the canvas; `Chart.Tooltip` floats
 * over it and `Chart.Legend` sits beneath, both as ordinary React Native views
 * so they can carry the type scale and a colour token.
 *
 * A colour may be a theme token or a literal — `lib/color`'s `isLiteralColor`
 * tells them apart, so `color: "#EC4899"` works beside `color: "chart-4"` with
 * no special-casing at the call site. At most eight token-valued series can be
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
 */
export const Chart = Object.assign(ChartRoot, {
	/** A hairline rule at each tick, painted with `border`. Draws first, under every mark. */
	Grid: ChartGrid,
	/** A stroked line through one series, in that series' colour. */
	Line: ChartLine,
	/** The region under one series, fading out towards the baseline. */
	Area: ChartArea,
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
