import type { ScaleDescriptor } from "./scale.types";

/**
 * A domain value's position along the range.
 *
 * Flat worklet: it calls nothing and closes over nothing, so a gesture
 * callback can reference it directly. See the package AGENTS.md.
 *
 * A zero-width domain returns the range midpoint rather than dividing by zero.
 * That case is real — a single datum, or a series that is one repeated value —
 * and one `NaN` written into a shared value freezes a chart permanently.
 */
export function scaleValue(scale: ScaleDescriptor, value: number): number {
	"worklet";
	const d0 = scale.domain[0];
	const d1 = scale.domain[1];
	const r0 = scale.range[0];
	const r1 = scale.range[1];

	switch (scale.kind) {
		case "linear":
		case "time": {
			if (d0 === d1) return (r0 + r1) / 2;
			return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
		}
		case "log": {
			if (d0 <= 0 || d1 <= 0 || d0 === d1) return (r0 + r1) / 2;
			const l0 = Math.log(d0);
			const l1 = Math.log(d1);
			const lv = Math.log(value > 0 ? value : Number.MIN_VALUE);
			return r0 + ((lv - l0) / (l1 - l0)) * (r1 - r0);
		}
	}
}

/**
 * The domain value at a position along the range — `scaleValue` inverted.
 *
 * This is the one piece of scale maths that runs on the UI thread every frame
 * of a scrub, which is the whole reason the descriptor is plain data.
 *
 * Flat worklet: calls nothing, closes over nothing.
 */
export function invertValue(scale: ScaleDescriptor, position: number): number {
	"worklet";
	const d0 = scale.domain[0];
	const d1 = scale.domain[1];
	const r0 = scale.range[0];
	const r1 = scale.range[1];

	if (r0 === r1) return d0;
	const t = (position - r0) / (r1 - r0);

	switch (scale.kind) {
		case "linear":
		case "time":
			return d0 + t * (d1 - d0);
		case "log": {
			if (d0 <= 0 || d1 <= 0) return d0;
			const l0 = Math.log(d0);
			const l1 = Math.log(d1);
			return Math.exp(l0 + t * (l1 - l0));
		}
	}
}
