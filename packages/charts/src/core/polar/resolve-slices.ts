import type { PieSliceData, PolarLayout } from "./polar.types";

export type ResolveSlicesOptions = {
	readonly values: readonly number[];
	readonly labels: readonly string[];
	readonly layout: PolarLayout;
	/** Where the first slice begins. Degrees clockwise from 12 o'clock. */
	readonly startAngle?: number;
	/** How much of the circle the slices fill. 180 is a half-pie gauge. */
	readonly circleSweepDegrees?: number;
};

/**
 * Every value as a slice of the circle.
 *
 * A negative or unreadable value gets a **zero sweep and keeps its index**.
 * Dropping it would move every later slice one place, and a legend built from
 * the same rows would then colour the wrong slice.
 *
 * The sweeps sum to the circle exactly: the last slice with any sweep absorbs
 * the floating-point drift of the others. Without that, seven equal slices end
 * a hair short of 360° and a hairline of background shows through at the seam.
 */
export function resolveSlices(options: ResolveSlicesOptions): PieSliceData[] {
	const { values, labels, layout, startAngle = 0, circleSweepDegrees = 360 } = options;
	const clean = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
	const total = clean.reduce((sum, value) => sum + value, 0);
	const circle = Number.isFinite(circleSweepDegrees) ? circleSweepDegrees : 360;
	const origin = Number.isFinite(startAngle) ? startAngle : 0;

	const sweeps = clean.map((value) => (total > 0 ? (value / total) * circle : 0));
	const last = clean.reduce((found, value, index) => (value > 0 ? index : found), -1);
	if (last >= 0) {
		const others = sweeps.reduce((sum, sweep, index) => (index === last ? sum : sum + sweep), 0);
		sweeps[last] = circle - others;
	}

	let cursor = origin;
	return clean.map((value, index) => {
		const sweepAngle = sweeps[index] as number;
		const start = cursor;
		cursor += sweepAngle;
		const fraction = total > 0 ? value / total : 0;
		return {
			index,
			label: labels[index] ?? String(index),
			value,
			fraction,
			startAngle: start,
			endAngle: start + sweepAngle,
			sweepAngle,
			center: layout.center,
			radius: layout.radius,
			innerRadius: layout.innerRadius,
			sliceIsEntireCircle: circle === 360 && fraction === 1,
		};
	});
}
