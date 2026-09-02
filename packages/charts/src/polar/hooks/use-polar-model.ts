import type { SkFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { DEFAULT_CHART_ANIMATION } from "../../animation/animation.types";
import type { ChartRow, ChartSize } from "../../core/chart.types";
import { collectPieInput } from "../../core/polar/pie-input";
import type { InnerRadius } from "../../core/polar/polar.types";
import { resolvePolarLayout } from "../../core/polar/resolve-layout";
import { resolveSlices } from "../../core/polar/resolve-slices";
import type { SidedNumber } from "../../core/util/sided-number";
import { fontMetrics } from "../../skia/font";
import type { PolarContextValue } from "../polar-chart.types";

export type UsePolarModelOptions = {
	readonly data: readonly ChartRow[];
	readonly valueKey: string;
	readonly labelKey?: string;
	readonly canvas: ChartSize;
	readonly padding?: SidedNumber;
	readonly size?: number;
	readonly innerRadius?: InnerRadius;
	readonly startAngle?: number;
	readonly circleSweepDegrees?: number;
	readonly animation?: ChartAnimation;
	readonly font?: SkFont | null;
	readonly selectedIndex?: number | null;
};

/**
 * The whole pie, resolved: the circle's place on the canvas and every slice.
 *
 * Nothing here is measured, so unlike the cartesian model there is a single
 * pass. The hook exists to memoise it — every mark below reads `slices`, and a
 * fresh array on each render would rebuild every slice path and restart every
 * morph while nothing had changed.
 */
export function usePolarModel(options: UsePolarModelOptions): PolarContextValue {
	const {
		data,
		valueKey,
		labelKey,
		canvas,
		padding,
		size,
		innerRadius,
		startAngle = 0,
		circleSweepDegrees = 360,
		animation = DEFAULT_CHART_ANIMATION,
		font = null,
		selectedIndex = null,
	} = options;

	return useMemo<PolarContextValue>(() => {
		const layout = resolvePolarLayout({ canvas, padding, size, innerRadius });
		const { values, labels } = collectPieInput(data, valueKey, labelKey);
		const slices = resolveSlices({ values, labels, layout, startAngle, circleSweepDegrees });
		const metrics = fontMetrics(font);

		return {
			slices,
			center: layout.center,
			radius: layout.radius,
			innerRadius: layout.innerRadius,
			startAngle,
			circleSweepDegrees,
			canvas,
			font,
			lineHeight: metrics.ascent + metrics.descent,
			fontMetrics: metrics,
			animation,
			selectedIndex,
			ready: layout.radius > 0 && data.length > 0,
		};
	}, [
		data,
		valueKey,
		labelKey,
		canvas,
		padding,
		size,
		innerRadius,
		startAngle,
		circleSweepDegrees,
		animation,
		font,
		selectedIndex,
	]);
}
