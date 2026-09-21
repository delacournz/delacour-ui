import type { SkFont } from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import type { ChartAnimation } from "../animation/animation.types";
import type { ChartRow, ChartSize } from "../core/chart.types";
import type { InnerRadius, PieSliceData, PolarPoint } from "../core/polar/polar.types";
import type { LabelMetrics } from "../core/text/label-anchor";
import type { SidedNumber } from "../core/util/sided-number";

/**
 * Fields that can size a slice — a number, or nothing.
 *
 * The `string extends keyof Row` guard widens back to `string` for a row typed
 * only as an index signature; see `XKeyOf` in the cartesian types for why a
 * caller who has not typed their rows would otherwise be unable to name a key.
 */
export type ValueKeyOf<Row extends ChartRow> = string extends keyof Row
	? string
	: {
			[Key in keyof Row]-?: Row[Key] extends number | null | undefined ? Key : never;
		}[keyof Row] &
			string;

/** Fields that can name a slice. Widens the same way. */
export type LabelKeyOf<Row extends ChartRow> = string extends keyof Row
	? string
	: {
			[Key in keyof Row]-?: Row[Key] extends string | number | null | undefined ? Key : never;
		}[keyof Row] &
			string;

/** Everything a mark or a render prop can read about the chart. */
export type PolarContextValue = {
	/** One per row, in data order, zero-sweep slices included. */
	readonly slices: readonly PieSliceData[];
	readonly center: PolarPoint;
	readonly radius: number;
	readonly innerRadius: number;
	readonly startAngle: number;
	readonly circleSweepDegrees: number;
	/** The whole canvas, including the padding. */
	readonly canvas: ChartSize;
	/** `null` until the font resolves; a label mark then draws nothing. */
	readonly font: SkFont | null;
	readonly lineHeight: number;
	/** The font's ascent and descent, for placing a label by its glyph box. */
	readonly fontMetrics: LabelMetrics;
	readonly animation: ChartAnimation;
	/** The slice the caller has singled out, or `null`. */
	readonly selectedIndex: number | null;
	/** Whether there is room to draw in. */
	readonly ready: boolean;
};

export type PolarRenderArgs<Row extends ChartRow> = PolarContextValue & {
	readonly data: readonly Row[];
};

export type PolarChartProps<Row extends ChartRow, VK extends ValueKeyOf<Row>, LK extends LabelKeyOf<Row>> = {
	readonly data: readonly Row[];
	/** The field a slice's size comes from. */
	readonly valueKey: VK;
	/** The field a slice's label comes from. Without it, the row's index. */
	readonly labelKey?: LK;
	/** The donut hole — points, or a percentage of the radius. */
	readonly innerRadius?: InnerRadius;
	/** Where the first slice begins. Degrees clockwise from 12 o'clock. */
	readonly startAngle?: number;
	/** How much of the circle the slices fill. 180 is a half-pie gauge. */
	readonly circleSweepDegrees?: number;
	/** An explicit diameter. Otherwise the largest circle the canvas holds. */
	readonly size?: number;
	/** Space between the canvas edge and the circle. */
	readonly padding?: SidedNumber;
	readonly animation?: ChartAnimation;
	readonly font?: SkFont | null;
	/** The slice to single out. Marks read it; the root does nothing with it. */
	readonly selectedIndex?: number | null;
	/** Called with the tapped slice's index, or `null` for a tap outside every slice. */
	readonly onSlicePress?: (index: number | null) => void;
	/** Skia children, or a function of the resolved chart. */
	readonly children?: ReactNode | ((args: PolarRenderArgs<Row>) => ReactNode);
};
