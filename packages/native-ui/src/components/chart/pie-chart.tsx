import { PolarChart } from "delacour-react-native-charts";
import { type PieSliceData, resolvePolarLayout, resolveSlices } from "delacour-react-native-charts/core";
import { Children, isValidElement, type ReactElement, type ReactNode, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useThemeColor } from "../../hooks/use-theme-color";
import type { ChartConfig, ChartDatum } from "./chart.types";
import {
	type ChartSize,
	chartAxisFontSize,
	chartVariants,
	PIE_DEFAULT_INNER_RADIUS,
	pieInnerRadiusSpec,
	resolvePieSeries,
} from "./chart.variants";
import { ChartLegend } from "./chart-legend";
import { type PieChartContextValue, PieChartProvider } from "./pie-chart.context";
import { PieChartCenter } from "./pie-chart-center";
import { PieChartLabel } from "./pie-chart-label";
import { PieChartSlice } from "./pie-chart-slice";
import { PieChartTooltip } from "./pie-chart-tooltip";
import { useChartFont } from "./use-chart-font";
import { useChartPalette } from "./use-chart-palette";

export type PieChartProps = {
	/**
	 * Labels and colours by row name, for the rows that want one.
	 *
	 * Optional, because a pie's categories are its rows and the ramp already
	 * colours them in order. An entry is keyed by the row's `nameKey` value.
	 */
	config?: ChartConfig;
	data: readonly ChartDatum[];
	/** The field that names a slice. */
	nameKey: string;
	/** The field that sizes a slice. Negative, missing and unreadable values are dropped. */
	valueKey: string;
	size?: ChartSize;
	/** The hole, as a fraction of the radius. `0` is a pie; `0.6` is a donut. */
	innerRadius?: number;
	/** Where the first slice begins. Degrees clockwise from 12 o'clock. */
	startAngle?: number;
	/** The selected slice's index in the drawn order, or `null`. Controlled when given. */
	selectedIndex?: number | null;
	/** Called with a tapped slice's index, or `null` for a tap outside every slice. */
	onSelect?: (index: number | null) => void;
	className?: string;
	/** Named on the frame, so a capture flow or a test can find the plot. */
	testID?: string;
	children?: ReactNode;
};

/** The field names the engine rows are built with. */
const ENGINE_NAME_KEY = "name";
const ENGINE_VALUE_KEY = "value";

type EngineRow = { readonly name: string; readonly value: number };

function PieChartRoot({
	config,
	data,
	nameKey,
	valueKey,
	size = "md",
	innerRadius = PIE_DEFAULT_INNER_RADIUS,
	startAngle = 0,
	selectedIndex,
	onSelect,
	className,
	testID,
	children,
}: PieChartProps): ReactElement {
	const slots = chartVariants({ size });
	const [frame, setFrame] = useState({ width: 0, height: 0 });

	const resolved = useMemo(
		() => resolvePieSeries(data, nameKey, valueKey, config ?? {}),
		[data, nameKey, valueKey, config]
	);

	// Every theme lookup happens here, above the canvas — see `Chart`.
	const series = useChartPalette(resolved.series);
	const surfaceColor = useThemeColor("background");
	const font = useChartFont(chartAxisFontSize(size));

	const [selected, select] = useControllableState<number | null>({
		value: selectedIndex,
		defaultValue: null,
		onChange: onSelect,
	});

	// The engine draws the rows this resolved to, not the caller's data, so a
	// dropped row is dropped everywhere and the slice indices, the series and
	// the values all agree.
	const rows = useMemo<EngineRow[]>(
		() => series.map((entry, index) => ({ name: entry.label, value: resolved.values[index] ?? 0 })),
		[series, resolved.values]
	);

	const innerRadiusSpec = pieInnerRadiusSpec(innerRadius);

	// The same geometry the engine resolves, resolved again here for the parts
	// that live outside the canvas: the tooltip needs a slice's bisector, and
	// the engine's context stops at the canvas boundary.
	const slices = useMemo<PieSliceData[]>(() => {
		const layout = resolvePolarLayout({ canvas: frame, innerRadius: innerRadiusSpec });
		return resolveSlices({
			values: resolved.values,
			labels: series.map((entry) => entry.label),
			layout,
			startAngle,
		});
	}, [frame, innerRadiusSpec, resolved.values, series, startAngle]);

	const value = useMemo<PieChartContextValue>(
		() => ({
			series,
			values: resolved.values,
			total: resolved.total,
			slices,
			slots,
			size,
			surfaceColor,
			frame,
			nameKey,
			valueKey,
			innerRadius,
			selectedIndex: selected,
			select,
		}),
		[series, resolved, slices, slots, size, surfaceColor, frame, nameKey, valueKey, innerRadius, selected, select]
	);

	const { canvas, overlay, below, selectable } = useMemo(() => partitionPieChildren(children), [children]);

	const onLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setFrame((current) => (current.width === width && current.height === height ? current : { width, height }));
	};

	// A tap selects only when something would show it: a tooltip, a caller's
	// handler, or a controlled selection. Otherwise the chart takes no gesture
	// at all, and a pie in a list is nothing more than a picture.
	const onSlicePress = selectable || onSelect !== undefined || selectedIndex !== undefined ? select : undefined;

	return (
		<PieChartProvider value={value}>
			<View className={slots.root({ className })}>
				<View className={slots.frame()} onLayout={onLayout} testID={testID}>
					<PolarChart
						data={rows}
						font={font}
						innerRadius={innerRadiusSpec}
						labelKey={ENGINE_NAME_KEY}
						onSlicePress={onSlicePress}
						selectedIndex={selected}
						startAngle={startAngle}
						valueKey={ENGINE_VALUE_KEY}
					>
						<PieChartProvider value={value}>{canvas}</PieChartProvider>
					</PolarChart>
					{overlay}
				</View>
				{below}
			</View>
		</PieChartProvider>
	);
}

/**
 * Splits the children by where they have to be mounted, the way `Chart` does.
 *
 * Slices and labels are Skia marks and go inside the canvas; the centre and
 * the tooltip are React Native views floated over it; a legend, or anything
 * else, sits under it. Matching is by component identity, so a part must be a
 * direct child of `<PieChart>` — an array from `.map()` is fine, a part wrapped
 * in a caller's own component is not.
 *
 * It also reports whether a tooltip was placed, because that is what decides
 * whether a tap should select anything.
 */
function partitionPieChildren(children: ReactNode): {
	canvas: ReactNode[];
	overlay: ReactNode[];
	below: ReactNode[];
	selectable: boolean;
} {
	const canvas: ReactNode[] = [];
	const overlay: ReactNode[] = [];
	const below: ReactNode[] = [];
	let selectable = false;

	for (const child of Children.toArray(children)) {
		if (!isValidElement(child)) continue;
		if (child.type === PieChartSlice || child.type === PieChartLabel) canvas.push(child);
		else if (child.type === PieChartCenter) overlay.push(child);
		else if (child.type === PieChartTooltip) {
			overlay.push(child);
			selectable = true;
		} else below.push(child);
	}

	return { canvas, overlay, below, selectable };
}

/**
 * A pie or donut, wearing the theme's five-colour series ramp.
 *
 * A second root beside `Chart` rather than a part of it, because a pie shares
 * nothing with a cartesian plot on screen — no axes, no grid, no scrub — and
 * only the palette, the legend and the font underneath. Its categories are its
 * **rows**: the first row is `chart-1`, the second `chart-2`, and a `config`
 * entry keyed by a row's name overrides that one row's label or colour.
 *
 * `PieChart.Slice` and `PieChart.Label` draw into the canvas; `PieChart.Center`
 * and `PieChart.Tooltip` float over it as React Native views; `PieChart.Legend`
 * sits beneath. The tooltip answers a tap rather than a scrub — tap a slice to
 * select it and dim the rest, tap outside to clear — and `selectedIndex` with
 * `onSelect` makes the selection controlled.
 *
 * @example
 * <PieChart data={rows} nameKey="browser" valueKey="visitors">
 *   <PieChart.Slice />
 *   <PieChart.Legend />
 * </PieChart>
 *
 * @example
 * <PieChart data={rows} innerRadius={0.6} nameKey="browser" valueKey="visitors">
 *   <PieChart.Slice />
 *   <PieChart.Center label="Visitors" value="1,125" />
 *   <PieChart.Tooltip />
 * </PieChart>
 */
export const PieChart = Object.assign(PieChartRoot, {
	/** Every slice, in the series' colours, with a hairline between them. */
	Slice: PieChartSlice,
	/** A percentage — or a value, or the name — on every slice wide enough to hold one. */
	Label: PieChartLabel,
	/** A headline figure and a caption in the hole of a donut. A React Native view. */
	Center: PieChartCenter,
	/** A readout for the tapped slice. A React Native view, over the canvas. */
	Tooltip: PieChartTooltip,
	/** A swatch and a label per slice, under the chart. */
	Legend: ChartLegend,
	displayName: "DelacourUI.PieChart",
});
