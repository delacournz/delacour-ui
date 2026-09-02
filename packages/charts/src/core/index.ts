export { chooseMorphStrategy, type MorphStrategy } from "./animation/morph-strategy";
export { matchPointCounts, resamplePoints } from "./animation/resample-points";
export type { ChartBounds, ChartPoint, ChartRow, ChartSize } from "./chart.types";
export { type AreaPathOptions, buildAreaPath } from "./curve/build-area";
export { buildLinePath, isDrawable, type LinePathOptions } from "./curve/build-line";
export { APPROXIMATING_CURVES, CURVE_TYPES, CURVES, type CurveType } from "./curve/curves";
export { type ChartGutters, getChartBounds, hasArea, NO_GUTTERS } from "./geometry/chart-bounds";
export {
	type AxisPlan,
	type ChartFrame,
	type ChartPlan,
	type PlanAxisOptions,
	planAxis,
	type ResolveChartFrameOptions,
	resolveChartFrame,
} from "./geometry/chart-layout";
export { EMPTY_DOMAIN, type ResolveDomainOptions, resolveDomain } from "./geometry/domain";
export { type GridAxis, type GridSegment, type GridSegmentOptions, gridSegments } from "./geometry/grid-lines";
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
export { type MakeScaleOptions, makeScale } from "./scale/make-scale";
export { invertValue, scaleValue } from "./scale/scale";
export type { DomainTuple, RangeTuple, ScaleDescriptor, ScaleType } from "./scale/scale.types";
export { type AxisGutterInput, resolveAxisGutters } from "./text/axis-gutters";
export {
	categoricalTickFormat,
	defaultTickFormat,
	formatDateTick,
	formatNumberTick,
} from "./text/format-tick";
export { anchorX, anchorY, type LabelAlignment, type LabelPosition } from "./text/label-anchor";
export { type BuildTicksOptions, buildTicks } from "./ticks/build-ticks";
export { linearTicks, logTicks } from "./ticks/linear-ticks";
export type { ChartTick } from "./ticks/tick.types";
export { DEFAULT_TICK_COUNT, downsampleTicks, normalizeTickCount } from "./ticks/tick-count";
export { timeTicks } from "./ticks/time-ticks";
export { asNumber, isPlottable } from "./util/as-number";
export { clamp } from "./util/clamp";
export { extent, unionExtents } from "./util/extent";
export { type Side, type SidedNumber, sidesOf, valueFromSidedNumber } from "./util/sided-number";
