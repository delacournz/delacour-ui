import type { SkFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { DEFAULT_CHART_ANIMATION } from "../../animation/animation.types";
import type { ChartRow, ChartSize } from "../../core/chart.types";
import type { CurveType } from "../../core/curve/curves";
import { getChartBounds, hasArea } from "../../core/geometry/chart-bounds";
import {
	type AxisPlan,
	axisRanges,
	pickAxisRoles,
	placeAxisRoles,
	planAxis,
	resolveChartFrame,
} from "../../core/geometry/chart-layout";
import { type DomainPadding, resolveDomain, resolveDomainPadding } from "../../core/geometry/domain";
import { collectStackedYValues, stackSeries } from "../../core/geometry/stack";
import { resolveStep } from "../../core/geometry/step";
import { collectYValues, transformInputData } from "../../core/geometry/transform-input-data";
import { resolveXValues } from "../../core/geometry/x-values";
import { scaleValue } from "../../core/scale/scale";
import type { DomainTuple, RangeTuple, ScaleType } from "../../core/scale/scale.types";
import { categoricalTickFormat, defaultTickFormat } from "../../core/text/format-tick";
import { DEFAULT_TICK_COUNT } from "../../core/ticks/tick-count";
import type { SidedNumber } from "../../core/util/sided-number";
import type { ChartScrubState } from "../../gesture/gesture.types";
import { fontMetrics, measureLabelWidths } from "../../skia/font";
import type { AxisLabelFormatter, AxisOptions, ChartContextValue, ChartOrientation } from "../cartesian-chart.types";

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
	readonly domainPadding?: DomainPadding;
	readonly stackKeys?: readonly string[];
	readonly orientation?: ChartOrientation;
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
		stackKeys,
		orientation = "vertical",
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
	const stackSignature = (stackKeys ?? []).join(" ");

	// `yKeys` and `stackKeys` enter the dependency list as joined signatures, so
	// a fresh array of the same keys does not rebuild every scale and path on
	// each render.
	return useMemo<ChartContextValue>(() => {
		const keys = splitSignature(yKeySignature);
		const stackedKeys = splitSignature(stackSignature);
		const unstackedKeys = keys.filter((key) => !stackedKeys.includes(key));
		const { values: xValues, isCategorical, raw } = resolveXValues(data, xKey);
		const pad = resolveDomainPadding(domainPadding);
		const xStepValue = resolveStep(xValues);

		const xKind = resolveXKind(xScaleType, isCategorical, raw);
		const yKind = yScaleType ?? "linear";
		const shown = pickAxisRoles(xAxis?.show ?? true, yAxis?.show ?? true, orientation);

		const xDomain = resolveDomain({ values: xValues, domain: domain?.x, absolutePadding: pad.x * xStepValue });
		const yDomain = resolveDomain({
			values: [...collectYValues(data, unstackedKeys), ...collectStackedYValues(data, stackedKeys)],
			domain: domain?.y,
			padding: pad.y,
			includeZero,
		});

		// The category axis and the value axis are planned by role; the
		// orientation decides which canvas axis each lands on, and from the
		// frame onward `x` and `y` name canvas axes only.
		const outer = getChartBounds(canvas, padding);
		const ranges = axisRanges(outer, orientation);
		const axes = pickAxisRoles(xAxis, yAxis, orientation);
		const plan = placeAxisRoles(
			planCategoryAxis({
				domain: xDomain,
				kind: xKind,
				range: ranges.category,
				axis: axes.category,
				show: shown.category,
				isCategorical,
				xValues,
				raw,
			}),
			planAxis({
				domain: yDomain,
				kind: yKind,
				range: ranges.value,
				tickCount: axes.value?.tickCount ?? DEFAULT_TICK_COUNT,
				tickValues: axes.value?.tickValues,
				format: axes.value?.formatLabel ?? defaultTickFormat(yKind, 0),
				show: shown.value,
				nice: niceDomain,
			}),
			orientation
		);

		const metrics = fontMetrics(font);
		const lineHeight = metrics.ascent + metrics.descent;
		const frame = resolveChartFrame({
			canvas,
			padding,
			plan,
			xLabelWidths: measureLabelWidths(font, plan.x.labels),
			yLabelWidths: measureLabelWidths(font, plan.y.labels),
			lineHeight,
			showXAxis: xAxis?.show ?? true,
			showYAxis: yAxis?.show ?? true,
			orientation,
		});

		const { points, xPositions } = transformInputData({
			data,
			yKeys: keys,
			xValues,
			xScale: frame.xScale,
			yScale: frame.yScale,
			orientation,
		});

		const { category: categoryScale, value: valueScale } = pickAxisRoles(frame.xScale, frame.yScale, orientation);
		const x0 = categoryScale.domain[0];
		const xStep = {
			value: xStepValue,
			px: Math.abs(scaleValue(categoryScale, x0 + xStepValue) - scaleValue(categoryScale, x0)),
		};

		const stacked = stackSeries({ data, keys: stackedKeys, xValues, xPositions, yScale: valueScale, orientation });

		return {
			points,
			xPositions,
			xStep,
			stacked,
			orientation,
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
		stackSignature,
		orientation,
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

type PlanCategoryAxisOptions = {
	readonly domain: DomainTuple;
	readonly kind: ScaleType;
	readonly range: RangeTuple;
	readonly axis: AxisOptions | undefined;
	readonly show: boolean;
	readonly isCategorical: boolean;
	readonly xValues: readonly number[];
	readonly raw: readonly unknown[];
};

/**
 * The category axis' plan. A categorical axis ticks on its own data, not on
 * round numbers — index 2.5 names no month — and prints the original label.
 */
function planCategoryAxis(options: PlanCategoryAxisOptions): AxisPlan {
	const { domain, kind, range, axis, show, isCategorical, xValues, raw } = options;
	return planAxis({
		domain,
		kind,
		range,
		tickCount: axis?.tickCount ?? DEFAULT_TICK_COUNT,
		tickValues: axis?.tickValues ?? (isCategorical ? xValues : undefined),
		format: axis?.formatLabel ?? categoricalOrValueFormat(isCategorical, raw, kind, domain),
		show,
	});
}

/** A joined key signature back into keys; the empty signature is no keys. */
function splitSignature(signature: string): string[] {
	return signature === "" ? [] : signature.split(" ");
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
