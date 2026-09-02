export { chooseMorphStrategy, type MorphStrategy } from "./animation/morph-strategy";
export { matchPointCounts, resamplePoints } from "./animation/resample-points";
export type { ChartBounds, ChartOrientation, ChartPoint, ChartRow, ChartSegment, ChartSize } from "./chart.types";
export { type AreaPathOptions, buildAreaPath } from "./curve/build-area";
export { buildLinePath, isDrawable, type LinePathOptions } from "./curve/build-line";
export { APPROXIMATING_CURVES, CURVE_TYPES, CURVES, type CurveType } from "./curve/curves";
export {
	type Band,
	type GroupLayout,
	type GroupLayoutOptions,
	groupLayout,
	type ResolveBandOptions,
	resolveBand,
} from "./geometry/band";
export { categoryDomainCovers } from "./geometry/category-domain";
export { type ChartGutters, getChartBounds, hasArea, NO_GUTTERS } from "./geometry/chart-bounds";
export {
	type AxisPlan,
	axisRanges,
	type ChartFrame,
	type ChartPlan,
	type PlanAxisOptions,
	pickAxisRoles,
	placeAxisRoles,
	planAxis,
	type ResolveChartFrameOptions,
	resolveChartFrame,
} from "./geometry/chart-layout";
export {
	type DomainPadding,
	EMPTY_DOMAIN,
	type ResolveDomainOptions,
	resolveDomain,
	resolveDomainPadding,
} from "./geometry/domain";
export { type GridAxis, type GridSegment, type GridSegmentOptions, gridSegments } from "./geometry/grid-lines";
export { collectStackedYValues, type StackSeriesOptions, stackSeries } from "./geometry/stack";
export { resolveStep } from "./geometry/step";
export {
	collectYValues,
	type TransformedData,
	type TransformInputOptions,
	transformInputData,
} from "./geometry/transform-input-data";
export { type ResolvedXValues, resolveXValues } from "./geometry/x-values";
export { closestIndex } from "./interaction/closest-index";
export { type CurvePath, type CurveRun, RUN_STRIDE, runSegmentCount, toCurvePath } from "./interaction/path-segments";
export { getYForX } from "./interaction/y-for-x";
// polar — pie and donut geometry
export { ARC_SEGMENTS, buildSliceEdgePath, buildSlicePath } from "./polar/build-slice-path";
export { sliceLabelPosition } from "./polar/label-position";
export { collectPieInput, type PieInput } from "./polar/pie-input";
export type { InnerRadius, PieSliceData, PolarLayout, PolarPoint } from "./polar/polar.types";
export { normalizeDegrees, polarToCartesian } from "./polar/polar-point";
export { type ResolvePolarLayoutOptions, resolveInnerRadius, resolvePolarLayout } from "./polar/resolve-layout";
export { type ResolveSlicesOptions, resolveSlices } from "./polar/resolve-slices";
export { sliceIndexAt } from "./polar/slice-index-at";
export { sliceOpacity } from "./polar/slice-opacity";
export { type MakeScaleOptions, makeScale } from "./scale/make-scale";
export { invertValue, scaleValue } from "./scale/scale";
export type { DomainTuple, RangeTuple, ScaleDescriptor, ScaleType } from "./scale/scale.types";
// shape — bars, scatter and candles, each on a fixed verb sequence
export {
	type BarPoint,
	type BarRect,
	type BarRectOptions,
	barRects,
	barsPathFromRects,
	buildBarsPath,
	resolveBaseline,
} from "./shape/build-bars";
export {
	buildCandlePaths,
	type Candle,
	type CandlePathOptions,
	type CandlePaths,
	candlePoints,
	candleSentiment,
	SENTIMENTS,
	type Sentiment,
} from "./shape/build-candles";
export { buildScatterPath, type ScatterPathOptions, type ScatterShape } from "./shape/build-scatter";
export { type CornerRadii, KAPPA, rectPath } from "./shape/rect-path";
export { type AxisGutterInput, resolveAxisGutters } from "./text/axis-gutters";
export { type BarLabelAnchorOptions, type BarLabelPosition, barLabelAnchor } from "./text/bar-label";
export {
	categoricalTickFormat,
	defaultTickFormat,
	formatDateTick,
	formatNumberTick,
} from "./text/format-tick";
export {
	anchorX,
	anchorY,
	type LabelAlignment,
	type LabelMetrics,
	type LabelPosition,
	labelHeight,
} from "./text/label-anchor";
export { type BuildTicksOptions, buildTicks } from "./ticks/build-ticks";
export { linearTicks, logTicks } from "./ticks/linear-ticks";
export type { ChartTick } from "./ticks/tick.types";
export { DEFAULT_TICK_COUNT, downsampleTicks, normalizeTickCount } from "./ticks/tick-count";
export { timeTicks } from "./ticks/time-ticks";
export { asNumber, isPlottable } from "./util/as-number";
export { clamp } from "./util/clamp";
export { extent, unionExtents } from "./util/extent";
export { readAt } from "./util/read-at";
export { type Side, type SidedNumber, sidesOf, valueFromSidedNumber } from "./util/sided-number";
