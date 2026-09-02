import type { ChartBounds, ChartOrientation, ChartSize } from "../chart.types";
import { makeScale } from "../scale/make-scale";
import type { DomainTuple, RangeTuple, ScaleDescriptor, ScaleType } from "../scale/scale.types";
import { resolveAxisGutters } from "../text/axis-gutters";
import { buildTicks } from "../ticks/build-ticks";
import type { ChartTick } from "../ticks/tick.types";
import type { SidedNumber } from "../util/sided-number";
import { getChartBounds } from "./chart-bounds";

/**
 * Something per axis role, picked out of something per canvas axis.
 *
 * A chart has a category axis and a value axis; the canvas has x and y.
 * Vertical maps category to x; horizontal maps it to y. Every place that
 * would otherwise write `horizontal ? y : x` goes through here, so the swap
 * is made in one spot and cannot be made in one direction only.
 */
export function pickAxisRoles<T>(x: T, y: T, orientation: ChartOrientation): { category: T; value: T } {
	return orientation === "horizontal" ? { category: y, value: x } : { category: x, value: y };
}

/** The inverse of `pickAxisRoles`: per role back onto the canvas axes. */
export function placeAxisRoles<T>(category: T, value: T, orientation: ChartOrientation): { x: T; y: T } {
	return orientation === "horizontal" ? { x: value, y: category } : { x: category, y: value };
}

/**
 * The canvas range each role maps into.
 *
 * Values always grow away from the origin corner: up the y axis, or right
 * along x. Categories run left to right, or **top to bottom** when horizontal
 * — so the first row is the top one, as in a table, and the category
 * positions ascend, which the scrub's binary search requires.
 */
export function axisRanges(
	outer: ChartBounds,
	orientation: ChartOrientation
): { category: RangeTuple; value: RangeTuple } {
	return orientation === "horizontal"
		? { category: [outer.top, outer.bottom], value: [outer.left, outer.right] }
		: { category: [outer.left, outer.right], value: [outer.bottom, outer.top] };
}

/** What one axis decided before anything was measured. */
export type AxisPlan = {
	readonly domain: DomainTuple;
	readonly kind: ScaleType;
	readonly tickValues: readonly number[];
	readonly labels: readonly string[];
};

export type ChartPlan = {
	readonly x: AxisPlan;
	readonly y: AxisPlan;
};

export type PlanAxisOptions = {
	readonly domain: DomainTuple;
	readonly kind: ScaleType;
	readonly range: readonly [number, number];
	readonly tickCount: number;
	/** Explicit values, instead of generating any. */
	readonly tickValues?: readonly number[];
	readonly format: (value: number, index: number) => string;
	readonly show: boolean;
	readonly nice?: boolean;
};

/**
 * Pass one: what an axis will say, decided against the whole canvas.
 *
 * The tick *values* are chosen here and never chosen again. That is what
 * breaks the measure/gutter cycle — label width sets the gutter, the gutter
 * sets the plot rect, and the plot rect would set the tick count, which is a
 * loop. Fixing the values after one look at the full canvas means the second
 * pass moves positions only, and there is nothing left to iterate.
 */
export function planAxis(options: PlanAxisOptions): AxisPlan {
	const scale = makeScale({
		kind: options.kind,
		domain: options.domain,
		range: options.range,
		// Nice to the count this axis will actually tick at, not to d3's default
		// of ten. `[28, 91]` niced at ten rounds to `[25, 95]`, and four ticks
		// across that lands on 40/60/80 — three labels, neither of them at an
		// end of the axis. Niced at four it rounds to `[20, 100]` and ticks
		// 20/40/60/80/100, which both ends and every gridline agree with.
		nice: options.nice === true ? options.tickCount : options.nice,
	});

	const ticks = buildTicks(scale, { values: options.tickValues, count: options.tickCount });
	const tickValues = ticks.map((tick) => tick.value);

	return {
		domain: scale.domain,
		kind: options.kind,
		tickValues,
		labels: options.show ? tickValues.map((value, index) => options.format(value, index)) : [],
	};
}

/** The resolved frame: where the plot sits and what maps into it. */
export type ChartFrame = {
	readonly bounds: ChartBounds;
	readonly xScale: ScaleDescriptor;
	readonly yScale: ScaleDescriptor;
	readonly xTicks: readonly ChartTick[];
	readonly yTicks: readonly ChartTick[];
};

export type ResolveChartFrameOptions = {
	readonly canvas: ChartSize;
	readonly padding?: SidedNumber;
	readonly plan: ChartPlan;
	/** Measured advance widths of the x labels, in the plan's order. */
	readonly xLabelWidths: readonly number[];
	readonly yLabelWidths: readonly number[];
	readonly lineHeight: number;
	readonly showXAxis: boolean;
	readonly showYAxis: boolean;
	/**
	 * Which canvas axis holds the categories. The frame builds the scales, so
	 * it has to know: a horizontal chart's y range runs top to bottom for the
	 * categories, where a vertical chart's runs bottom to top for the values.
	 */
	readonly orientation?: ChartOrientation;
};

/**
 * Pass two: gutters from the measurements, then the plot rect and the scales.
 *
 * The domains come from the plan rather than being re-derived, so a `nice()`
 * applied in pass one is not applied twice, and the two passes cannot disagree
 * about what the axis covers.
 */
export function resolveChartFrame(options: ResolveChartFrameOptions): ChartFrame {
	const { canvas, padding, plan } = options;

	const gutters = resolveAxisGutters({
		xLabelWidths: options.xLabelWidths,
		yLabelWidths: options.yLabelWidths,
		fontHeight: options.lineHeight,
		showXAxis: options.showXAxis,
		showYAxis: options.showYAxis,
	});

	const bounds = getChartBounds(canvas, padding, gutters);

	const orientation = options.orientation ?? "vertical";
	const byRole = axisRanges(bounds, orientation);
	const ranges = placeAxisRoles(byRole.category, byRole.value, orientation);
	const xScale = makeScale({ kind: plan.x.kind, domain: plan.x.domain, range: ranges.x });
	const yScale = makeScale({ kind: plan.y.kind, domain: plan.y.domain, range: ranges.y });

	return {
		bounds,
		xScale,
		yScale,
		xTicks: buildTicks(xScale, { values: plan.x.tickValues, count: plan.x.tickValues.length }),
		yTicks: buildTicks(yScale, { values: plan.y.tickValues, count: plan.y.tickValues.length }),
	};
}
