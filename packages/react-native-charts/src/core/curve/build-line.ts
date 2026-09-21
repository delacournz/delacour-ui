import { line } from "d3-shape";
import type { ChartPoint } from "../chart.types";
import { CURVES, type CurveType } from "./curves";

export type LinePathOptions = {
	readonly curve?: CurveType;
	/**
	 * Draw straight through a gap instead of breaking the line.
	 *
	 * The default breaks it, because a line drawn across missing data asserts a
	 * trend that was never measured.
	 */
	readonly connectMissingData?: boolean;
};

/** Whether a point can be drawn — both coordinates finite, and not a gap. */
export function isDrawable(point: ChartPoint): boolean {
	return point.y !== null && Number.isFinite(point.y) && Number.isFinite(point.x);
}

/**
 * An SVG path string through `points`.
 *
 * A string rather than a Skia path because this module is pure — Skia's
 * builder cannot be imported here without taking the whole test suite down
 * (see the package AGENTS.md). `src/skia/build-path.ts` parses it.
 *
 * Gaps come out as separate subpaths via d3's `.defined()`, so a broken series
 * is one path object with several `M` commands rather than several paths.
 */
export function buildLinePath(points: readonly ChartPoint[], options: LinePathOptions = {}): string {
	if (points.length === 0) return "";
	const curve = CURVES[options.curve ?? "linear"];

	if (options.connectMissingData) {
		const drawable = points.filter(isDrawable);
		if (drawable.length === 0) return "";
		return (
			line<ChartPoint>()
				.x((point) => point.x)
				.y((point) => point.y as number)
				.curve(curve)(drawable) ?? ""
		);
	}

	return (
		line<ChartPoint>()
			.x((point) => point.x)
			.y((point) => point.y ?? 0)
			.defined(isDrawable)
			.curve(curve)(points) ?? ""
	);
}
