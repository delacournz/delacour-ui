import type { SkFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { DEFAULT_CHART_ANIMATION } from "../../animation/animation.types";
import type { ChartRow, ChartSize } from "../../core/chart.types";
import type { CurveType } from "../../core/curve/curves";
import { getChartBounds, hasArea } from "../../core/geometry/chart-bounds";
import { type ChartPlan, planAxis, resolveChartFrame } from "../../core/geometry/chart-layout";
import { resolveDomain } from "../../core/geometry/domain";
import { collectYValues, transformInputData } from "../../core/geometry/transform-input-data";
import { resolveXValues } from "../../core/geometry/x-values";
import type { ScaleType } from "../../core/scale/scale.types";
import { categoricalTickFormat, defaultTickFormat } from "../../core/text/format-tick";
import { DEFAULT_TICK_COUNT } from "../../core/ticks/tick-count";
import type { SidedNumber } from "../../core/util/sided-number";
import type { ChartScrubState } from "../../gesture/gesture.types";
import { fontMetrics, measureLabelWidths } from "../../skia/font";
import type { AxisLabelFormatter, AxisOptions, ChartContextValue } from "../cartesian-chart.types";

export type UseChartModelOptions = {
	readonly data: readonly ChartRow[];
	readonly xKey: string;
	readonly yKeys: readonly string[];
	readonly canvas: ChartSize;
	readonly padding?: SidedNumber;
	readonly domain?: {
		readonly x?: readonly [number | undefined, number | undefined];
		readonly y?: readonly [number | undefined, number | undefined];
	};
	readonly domainPadding?: number;
	readonly includeZero?: boolean;
	readonly niceDomain?: boolean;
	readonly xScaleType?: ScaleType;
	readonly yScaleType?: ScaleType;
	readonly curve?: CurveType;
	readonly animation?: ChartAnimation;
	readonly xAxis?: AxisOptions;
	readonly yAxis?: AxisOptions;
	readonly font?: SkFont | null;
	readonly scrub?: ChartScrubState;
};

/**
 * The whole chart, resolved: scales, ticks, plot rect and plotted points.
 *
 * The layout is two passes and the maths for both lives in
 * `core/geometry/chart-layout.ts` — `planAxis` decides tick values against the
 * full canvas, this hook measures those labels with the font, and
 * `resolveChartFrame` turns the measurements into a plot rect and moves the
 * scales into it. The tick values never change between the passes, which is
 * what stops the measure/gutter cycle from iterating.
 *
 * Only the measuring is here. Everything either side of it is pure and tested.
 */
export function useChartModel(options: UseChartModelOptions): ChartContextValue {
	const {
		data,
		xKey,
		yKeys,
		canvas,
		padding,
		domain,
		domainPadding,
		includeZero,
		niceDomain,
		xScaleType,
		yScaleType,
		curve = "linear",
		animation = DEFAULT_CHART_ANIMATION,
		xAxis,
		yAxis,
		font = null,
		scrub,
	} = options;

	const yKeySignature = yKeys.join(" ");

	// `yKeys` enters the dependency list as its joined signature, so a fresh
	// array of the same keys does not rebuild every scale and path on each render.
	return useMemo<ChartContextValue>(() => {
		const keys = yKeySignature === "" ? [] : yKeySignature.split(" ");
		const { values: xValues, isCategorical, raw } = resolveXValues(data, xKey);

		const xKind = resolveXKind(xScaleType, isCategorical, raw);
		const yKind = yScaleType ?? "linear";
		const showX = xAxis?.show ?? true;
		const showY = yAxis?.show ?? true;

		const xDomain = resolveDomain({ values: xValues, domain: domain?.x });
		const yDomain = resolveDomain({
			values: collectYValues(data, keys),
			domain: domain?.y,
			padding: domainPadding,
			includeZero,
		});

		const outer = getChartBounds(canvas, padding);
		const plan: ChartPlan = {
			x: planAxis({
				domain: xDomain,
				kind: xKind,
				range: [outer.left, outer.right],
				tickCount: xAxis?.tickCount ?? DEFAULT_TICK_COUNT,
				// A categorical axis ticks on its own data, not on round numbers:
				// index 2.5 names no month.
				tickValues: xAxis?.tickValues ?? (isCategorical ? xValues : undefined),
				format: xAxis?.formatLabel ?? categoricalOrValueFormat(isCategorical, raw, xKind, xDomain),
				show: showX,
			}),
			y: planAxis({
				domain: yDomain,
				kind: yKind,
				range: [outer.bottom, outer.top],
				tickCount: yAxis?.tickCount ?? DEFAULT_TICK_COUNT,
				tickValues: yAxis?.tickValues,
				format: yAxis?.formatLabel ?? defaultTickFormat(yKind, 0),
				show: showY,
				nice: niceDomain,
			}),
		};

		const metrics = fontMetrics(font);
		const lineHeight = metrics.ascent + metrics.descent;
		const frame = resolveChartFrame({
			canvas,
			padding,
			plan,
			xLabelWidths: measureLabelWidths(font, plan.x.labels),
			yLabelWidths: measureLabelWidths(font, plan.y.labels),
			lineHeight,
			showXAxis: showX,
			showYAxis: showY,
		});

		const { points } = transformInputData({
			data,
			yKeys: keys,
			xValues,
			xScale: frame.xScale,
			yScale: frame.yScale,
		});

		return {
			points,
			bounds: frame.bounds,
			canvas,
			xScale: frame.xScale,
			yScale: frame.yScale,
			xTicks: frame.xTicks,
			yTicks: frame.yTicks,
			xLabels: plan.x.labels,
			yLabels: plan.y.labels,
			yKeys: keys,
			font,
			lineHeight,
			fontMetrics: metrics,
			curve,
			animation,
			scrub: scrub ?? null,
			isCategorical,
			ready: hasArea(frame.bounds) && data.length > 0,
		};
	}, [
		data,
		xKey,
		yKeySignature,
		canvas,
		padding,
		domain,
		domainPadding,
		includeZero,
		niceDomain,
		xScaleType,
		yScaleType,
		curve,
		animation,
		xAxis,
		yAxis,
		font,
		scrub,
	]);
}

/** A date-valued x field gets a time scale unless the caller says otherwise. */
function resolveXKind(explicit: ScaleType | undefined, isCategorical: boolean, raw: readonly unknown[]): ScaleType {
	if (explicit !== undefined) return explicit;
	if (isCategorical) return "linear";
	return raw.some((value) => value instanceof Date) ? "time" : "linear";
}

/** A categorical axis prints the original label; anything else prints its value. */
function categoricalOrValueFormat(
	isCategorical: boolean,
	raw: readonly unknown[],
	kind: ScaleType,
	domain: readonly [number, number]
): AxisLabelFormatter {
	if (isCategorical) {
		const label = categoricalTickFormat(raw);
		return (value) => label(value);
	}
	const format = defaultTickFormat(kind, Math.abs(domain[1] - domain[0]));
	return (value) => format(value);
}
