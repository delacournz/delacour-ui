import { Canvas } from "@shopify/react-native-skia";
import { type ReactElement, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { ChartRow } from "../core/chart.types";
import { buildLinePath } from "../core/curve/build-line";
import { toCurvePath } from "../core/interaction/path-segments";
import { EMPTY_SCRUB_MODEL, type ScrubModel, type ScrubSeries } from "../gesture/gesture.types";
import { ChartGestureOverlay } from "../gesture/gesture-overlay";
import { useScrubGesture } from "../gesture/use-scrub-gesture";
import { CartesianChartContext } from "./cartesian-chart.context";
import type { CartesianChartProps, CartesianRenderArgs, XKeyOf, YKeyOf } from "./cartesian-chart.types";
import { useCanvasSize } from "./hooks/use-canvas-size";
import { useChartModel } from "./hooks/use-chart-model";

/**
 * A cartesian chart: scales, ticks, a plot rect, and whatever marks you place.
 *
 * ## Where things are mounted, and why
 *
 * ```
 * View        onLayout, and the only thing that knows the chart's size
 *   Canvas    the Skia reconciler starts here
 *     Provider  ← rendered INSIDE the canvas, so marks below can read it
 *       children
 *   Overlay   an ordinary RN view; the canvas has no touch targets
 * ```
 *
 * The provider's position is the whole trick. `<Canvas>` mounts a second React
 * reconciler and context does not cross a reconciler boundary — but it
 * resolves by which reconciler renders the *provider node*, so placing the
 * provider among the canvas' children puts it in the Skia tree and consumers
 * below it resolve normally. No `its-fine`, no context bridge, no
 * `FiberProvider` wrapping the host app.
 *
 * The consequence for a themed wrapper is that every hook — `useThemeColor`,
 * anything reading a CSS variable — must be called **above** the canvas and
 * its result passed down as a plain value. There is nowhere inside to call one.
 *
 * ## Both child forms
 *
 * `children` may be Skia nodes, which read the chart from context, or a
 * function of the resolved chart. The same mark components serve both: given
 * `yKey` they read context, given `points` they use what they are handed.
 */
export function CartesianChart<
	Row extends ChartRow,
	const XK extends XKeyOf<Row>,
	const YK extends readonly YKeyOf<Row>[],
>(props: CartesianChartProps<Row, XK, YK>): ReactElement {
	const { data, xKey, yKeys, children, scrub, scrubConfig, onBoundsChange, ...rest } = props;

	const { size, onLayout } = useCanvasSize();

	const model = useChartModel({
		...rest,
		data: data as readonly ChartRow[],
		xKey,
		yKeys,
		canvas: size,
		scrub,
	});

	const { bounds, points, xPositions, stacked, xScale, yScale, curve, orientation } = model;

	// Everything the scrub worklet reads, as plain data in one shared value.
	// Rebuilt on the JavaScript thread whenever the chart changes; read on the
	// UI thread every frame of a drag.
	const scrubModel = useSharedValue<ScrubModel>(EMPTY_SCRUB_MODEL);

	// A stacked key's `ys` are the tops of its segments, so the cursor dot sits
	// on the segment that is visible; its `values` stay the raw series, which is
	// what a readout should print. On a horizontal chart the value position is
	// the point's x, and there is no curve to glide along.
	const nextScrubModel = useMemo<ScrubModel>(() => {
		const horizontal = orientation === "horizontal";
		const series: ScrubSeries[] = model.yKeys.map((key) => {
			const raw = points[key] ?? [];
			const drawn = stacked[key] ?? raw;
			return {
				key,
				path: horizontal ? [] : toCurvePath(buildLinePath(drawn, { curve })),
				ys: drawn.map((point) => (horizontal ? (point.yValue === null ? null : point.x) : point.y)),
				values: raw.map((point) => point.yValue),
			};
		});

		const scale = horizontal ? yScale : xScale;
		return {
			axis: horizontal ? "y" : "x",
			left: bounds.left,
			right: bounds.right,
			top: bounds.top,
			bottom: bounds.bottom,
			positions: xPositions,
			scale,
			xPositions,
			xScale: scale,
			series,
		};
	}, [bounds, points, stacked, xPositions, xScale, yScale, curve, model.yKeys, orientation]);

	useEffect(() => {
		scrubModel.value = nextScrubModel;
	}, [nextScrubModel, scrubModel]);

	useEffect(() => {
		onBoundsChange?.(bounds);
	}, [bounds, onBoundsChange]);

	const gesture = useScrubGesture({ state: scrub, model: scrubModel, config: scrubConfig });

	const content =
		typeof children === "function"
			? children({ ...model, points: model.points, data } as CartesianRenderArgs<Row, YK>)
			: children;

	return (
		<View onLayout={onLayout} style={styles.root}>
			<Canvas style={StyleSheet.absoluteFill}>
				<CartesianChartContext.Provider value={model}>{content}</CartesianChartContext.Provider>
			</Canvas>
			{gesture === null ? null : <ChartGestureOverlay gesture={gesture} />}
		</View>
	);
}

CartesianChart.displayName = "DelacourCharts.CartesianChart";

const styles = StyleSheet.create({
	root: { flex: 1, overflow: "hidden" },
});
