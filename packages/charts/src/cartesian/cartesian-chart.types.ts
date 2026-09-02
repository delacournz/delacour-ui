import type { SkFont } from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import type { ChartAnimation } from "../animation/animation.types";
import type { ChartBounds, ChartOrientation, ChartPoint, ChartRow, ChartSegment, ChartSize } from "../core/chart.types";
import type { CurveType } from "../core/curve/curves";
import type { DomainPadding } from "../core/geometry/domain";
import type { ScaleDescriptor, ScaleType } from "../core/scale/scale.types";
import type { LabelMetrics } from "../core/text/label-anchor";
import type { ChartTick } from "../core/ticks/tick.types";
import type { SidedNumber } from "../core/util/sided-number";
import type { ChartScrubState, ScrubConfig } from "../gesture/gesture.types";

/**
 * Fields that can position a point along x — a number, a date, or a label.
 *
 * A row typed only as `Record<string, unknown>` knows nothing about its own
 * fields, so narrowing it would produce `never` and reject every key. The
 * `string extends keyof Row` guard detects exactly that case — it holds only
 * for an index signature — and widens back to `string`. Without it a caller
 * who has not typed their rows cannot name a key at all, which is a type error
 * on correct code.
 */
export type XKeyOf<Row extends ChartRow> = string extends keyof Row
	? string
	: {
			[Key in keyof Row]-?: Row[Key] extends number | string | Date | null | undefined ? Key : never;
		}[keyof Row] &
			string;

/** Fields that can be measured up y. Widens the same way — see `XKeyOf`. */
export type YKeyOf<Row extends ChartRow> = string extends keyof Row
	? string
	: {
			[Key in keyof Row]-?: Row[Key] extends number | null | undefined ? Key : never;
		}[keyof Row] &
			string;

export type AxisLabelFormatter = (value: number, index: number) => string;

export type AxisOptions = {
	/** Draw this axis at all. Ticks and labels both. */
	readonly show?: boolean;
	/** How many ticks to aim for. The generator rounds it to human values. */
	readonly tickCount?: number;
	/** Explicit tick values, instead of generating any. */
	readonly tickValues?: readonly number[];
	readonly formatLabel?: AxisLabelFormatter;
};

export type { ChartOrientation };

/**
 * The width one datum owns along the category axis.
 *
 * `value` is in domain units — one for a categorical axis, a month's worth of
 * milliseconds on a monthly time scale. `px` is the same distance on the
 * canvas. A bar's band and the tooltip's highlight are both stated in it.
 *
 * It is the **category** step whichever axis the categories lie on: on a
 * horizontal chart `px` is a distance along y. The name keeps the vertical
 * case, like `xPositions` and `xValue`.
 */
export type ChartStep = {
	readonly value: number;
	readonly px: number;
};

/** Everything a mark, an axis or a render prop can read about the chart. */
export type ChartContextValue = {
	/** One array per y key, in the order the keys were given. */
	readonly points: Readonly<Record<string, readonly ChartPoint[]>>;
	/** Canvas position of each row's category, shared by every series — a y on a horizontal chart. */
	readonly xPositions: readonly number[];
	readonly xStep: ChartStep;
	/**
	 * The stacked series, one entry per key in `stackKeys`.
	 *
	 * `points[key]` still holds the raw series; a stacked mark reads here for
	 * the edges it draws between, and a tooltip reads there for the value it
	 * prints.
	 */
	readonly stacked: Readonly<Record<string, readonly ChartSegment[]>>;
	readonly orientation: ChartOrientation;
	/** The plot rect — the canvas minus padding and axis gutters. */
	readonly bounds: ChartBounds;
	/** The whole canvas, including the gutters. */
	readonly canvas: ChartSize;
	/** The scale on the canvas' x axis: categories when vertical, values when horizontal. */
	readonly xScale: ScaleDescriptor;
	/** The scale on the canvas' y axis: values when vertical, categories when horizontal. */
	readonly yScale: ScaleDescriptor;
	readonly xTicks: readonly ChartTick[];
	readonly yTicks: readonly ChartTick[];
	readonly xLabels: readonly string[];
	readonly yLabels: readonly string[];
	readonly yKeys: readonly string[];
	/** `null` until the font resolves; an axis then draws ticks and no labels. */
	readonly font: SkFont | null;
	readonly lineHeight: number;
	/** The font's ascent and descent, for placing a label by its glyph box. */
	readonly fontMetrics: LabelMetrics;
	readonly curve: CurveType;
	readonly animation: ChartAnimation;
	readonly scrub: ChartScrubState | null;
	/** Whether x holds positions rather than measurements. */
	readonly isCategorical: boolean;
	/** Whether there is room to draw in. */
	readonly ready: boolean;
};

export type CartesianRenderArgs<Row extends ChartRow, YK extends readonly string[]> = Omit<
	ChartContextValue,
	"points"
> & {
	readonly points: { readonly [Key in YK[number]]: readonly ChartPoint[] };
	readonly data: readonly Row[];
};

export type CartesianChartProps<Row extends ChartRow, XK extends XKeyOf<Row>, YK extends readonly YKeyOf<Row>[]> = {
	readonly data: readonly Row[];
	readonly xKey: XK;
	readonly yKeys: YK;

	/** Space between the canvas edge and the axes. */
	readonly padding?: SidedNumber;
	/** Explicit bounds. Either end of either axis may be omitted. */
	readonly domain?: {
		readonly x?: readonly [number | undefined, number | undefined];
		readonly y?: readonly [number | undefined, number | undefined];
	};
	/**
	 * Extra span at each end of the domain.
	 *
	 * A bare number pads y, as a fraction of the measured extent. An object
	 * names each axis; `x` is measured in **steps**, so `{ x: 0.5 }` is half a
	 * band each side — what a bar chart needs for its first and last bars to
	 * sit inside the plot rather than straddle its edges.
	 */
	readonly domainPadding?: DomainPadding;
	/**
	 * Which of `yKeys` stack on one another, bottom first.
	 *
	 * The root owns this rather than the mark because the y domain has to
	 * cover the running totals, and only the root builds the y scale. A stacked
	 * mark that stacked for itself would draw past the top of the plot.
	 */
	readonly stackKeys?: readonly string[];
	/**
	 * Categories along x (the default) or along y.
	 *
	 * Horizontal swaps the axis roles at the model: categories are planned into
	 * the y range and values into the x range, so `yTicks` and `yLabels` carry
	 * the categories and the left gutter is measured for them. Every mark reads
	 * the same flag.
	 */
	readonly orientation?: ChartOrientation;
	/** Pull zero into the y domain. What a bar chart needs; a line usually does not. */
	readonly includeZero?: boolean;
	/** Round the y domain out to tick values. */
	readonly niceDomain?: boolean;

	/** Defaults to `time` when the x field holds dates, `linear` otherwise. */
	readonly xScaleType?: ScaleType;
	readonly yScaleType?: ScaleType;
	/** The interpolator every mark uses unless it overrides it. */
	readonly curve?: CurveType;
	readonly animation?: ChartAnimation;

	readonly xAxis?: AxisOptions;
	readonly yAxis?: AxisOptions;
	readonly font?: SkFont | null;

	/** From `useChartScrub`. Without it the chart takes no touches. */
	readonly scrub?: ChartScrubState;
	readonly scrubConfig?: ScrubConfig;

	readonly onBoundsChange?: (bounds: ChartBounds) => void;

	/** Skia children, or a function of the resolved chart. */
	readonly children?: ReactNode | ((args: CartesianRenderArgs<Row, YK>) => ReactNode);
};
