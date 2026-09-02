import type { PolarPoint } from "./polar.types";

/**
 * A canvas point at `radius` from `center`, `degrees` clockwise from 12 o'clock.
 *
 * The trigonometric convention has 0° at 3 o'clock and runs counter-clockwise;
 * a pie chart's has 0° at the top and runs clockwise. The swap is done here,
 * once, so every angle elsewhere in the package can be stated the way a chart
 * reads and no mark has to remember which axis is `sin`.
 */
export function polarToCartesian(center: PolarPoint, radius: number, degrees: number): PolarPoint {
	const radians = (degrees * Math.PI) / 180;
	return {
		x: center.x + radius * Math.sin(radians),
		y: center.y - radius * Math.cos(radians),
	};
}

/**
 * `degrees` folded into `[0, 360)`.
 *
 * A non-finite angle becomes `0` rather than `NaN` — a `NaN` here would put a
 * slice nowhere and the whole chart would go blank with nothing logged.
 */
export function normalizeDegrees(degrees: number): number {
	if (!Number.isFinite(degrees)) return 0;
	const folded = ((degrees % 360) + 360) % 360;
	return folded === 360 ? 0 : folded;
}
