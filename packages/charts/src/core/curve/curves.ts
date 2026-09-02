import {
	curveBasis,
	curveBumpX,
	curveBumpY,
	curveCardinal,
	curveCatmullRom,
	curveLinear,
	curveMonotoneX,
	curveNatural,
	curveStep,
	curveStepAfter,
	curveStepBefore,
} from "d3-shape";

/**
 * The curve interpolators a mark can be drawn with.
 *
 * `monotone` is the default worth reaching for on a value-over-time series: it
 * is the only interpolating curve here that cannot overshoot, so a line
 * through non-negative data never dips below zero between two points and
 * invents a loss that never happened.
 *
 * `basis` is the odd one out and is kept deliberately. It approximates rather
 * than interpolates — the drawn line does not pass through its own data — so a
 * scrub dot placed on the curve will not coincide with any datum. Fine for a
 * decorative sparkline, wrong for anything a reader will measure.
 */
export const CURVES = {
	linear: curveLinear,
	monotone: curveMonotoneX,
	natural: curveNatural,
	basis: curveBasis,
	cardinal: curveCardinal,
	catmullRom: curveCatmullRom,
	bumpX: curveBumpX,
	bumpY: curveBumpY,
	step: curveStep,
	stepBefore: curveStepBefore,
	stepAfter: curveStepAfter,
} as const;

export type CurveType = keyof typeof CURVES;

/** Every curve name, for a caller mapping over the set. */
export const CURVE_TYPES = Object.keys(CURVES) as readonly CurveType[];

/** Curves that do not pass through their own data points. */
export const APPROXIMATING_CURVES: readonly CurveType[] = ["basis"];
