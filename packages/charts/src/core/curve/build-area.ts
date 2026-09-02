import { area } from "d3-shape";
import type { ChartPoint } from "../chart.types";
import { isDrawable } from "./build-line";
import { CURVES, type CurveType } from "./curves";

export type AreaPathOptions = {
	readonly curve?: CurveType;
	readonly connectMissingData?: boolean;
	/**
	 * Canvas y the fill closes against — usually the plot rect's bottom, or the
	 * position of zero when the series crosses it.
	 */
	readonly baseline: number;
	/** Per-point lower edge, for a band rather than a fill to a baseline. */
	readonly lower?: readonly (number | null)[];
};

/**
 * An SVG path string for the region between `points` and a baseline.
 *
 * Built with d3's `area` rather than by appending a closing edge to the line
 * path, so the lower edge follows the same interpolator as the upper one. A
 * hand-closed monotone area has a curved top and a straight bottom, and the
 * two disagree visibly wherever the baseline is not flat.
 */
export function buildAreaPath(points: readonly ChartPoint[], options: AreaPathOptions): string {
	if (points.length === 0) return "";
	const curve = CURVES[options.curve ?? "linear"];
	const lower = options.lower;

	const generator = area<ChartPoint>()
		.x((point) => point.x)
		.y1((point) => point.y ?? 0)
		.y0((_point, index) => {
			if (!lower) return options.baseline;
			const bound = lower[index];
			return bound === null || bound === undefined || !Number.isFinite(bound) ? options.baseline : bound;
		})
		.curve(curve);

	if (options.connectMissingData) {
		const drawable = points.filter(isDrawable);
		return drawable.length === 0 ? "" : (generator(drawable) ?? "");
	}

	return generator.defined(isDrawable)(points) ?? "";
}
