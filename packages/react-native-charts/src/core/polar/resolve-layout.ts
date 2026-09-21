import type { ChartSize } from "../chart.types";
import { type SidedNumber, sidesOf } from "../util/sided-number";
import type { InnerRadius, PolarLayout } from "./polar.types";

export type ResolvePolarLayoutOptions = {
	readonly canvas: ChartSize;
	/** Space between the canvas edge and the circle. */
	readonly padding?: SidedNumber;
	/** An explicit diameter, in points. Never larger than the padded canvas. */
	readonly size?: number;
	readonly innerRadius?: InnerRadius;
};

/**
 * The largest circle the padded canvas holds, centred in it.
 *
 * The radius is never negative: a canvas smaller than its padding — the first
 * layout pass, before anything has been measured — gives a zero radius, and a
 * zero radius draws nothing rather than an inverted slice.
 */
export function resolvePolarLayout(options: ResolvePolarLayoutOptions): PolarLayout {
	const { canvas, padding, size, innerRadius } = options;
	const sides = sidesOf(padding);
	const width = Math.max(0, canvas.width - sides.left - sides.right);
	const height = Math.max(0, canvas.height - sides.top - sides.bottom);
	const fit = Math.min(width, height) / 2;
	const radius = size !== undefined && Number.isFinite(size) ? Math.max(0, Math.min(fit, size / 2)) : fit;
	return {
		center: { x: sides.left + width / 2, y: sides.top + height / 2 },
		radius,
		innerRadius: resolveInnerRadius(innerRadius, radius),
	};
}

/**
 * The hole's radius in points, held inside `[0, radius)`.
 *
 * A hole as large as the circle would leave a ring of zero width, which draws
 * nothing and cannot be tapped, so the clamp stops one point short of it. An
 * unreadable value — `"abc%"`, `NaN` — is no hole, because a pie is the more
 * reasonable thing to draw than nothing.
 */
export function resolveInnerRadius(spec: InnerRadius | undefined, radius: number): number {
	if (radius <= 0) return 0;
	const requested = typeof spec === "number" ? spec : parsePercent(spec) * radius;
	if (!Number.isFinite(requested) || requested <= 0) return 0;
	return Math.min(requested, Math.max(0, radius - 1));
}

/** `"60%"` as `0.6`; `0` for anything that is not a percentage. */
function parsePercent(spec: `${number}%` | undefined): number {
	if (spec === undefined) return 0;
	const parsed = Number(spec.slice(0, -1));
	return Number.isFinite(parsed) ? parsed / 100 : 0;
}
