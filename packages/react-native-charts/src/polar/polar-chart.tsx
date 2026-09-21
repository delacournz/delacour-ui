import { Canvas } from "@shopify/react-native-skia";
import { type ReactElement, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import { useCanvasSize } from "../cartesian/hooks/use-canvas-size";
import type { ChartRow } from "../core/chart.types";
import { sliceIndexAt } from "../core/polar/slice-index-at";
import { ChartGestureOverlay } from "../gesture/gesture-overlay";
import { usePolarModel } from "./hooks/use-polar-model";
import { PolarChartContext } from "./polar-chart.context";
import type { LabelKeyOf, PolarChartProps, PolarContextValue, PolarRenderArgs, ValueKeyOf } from "./polar-chart.types";

/**
 * A polar chart: a circle on the canvas, cut into slices, and whatever marks
 * you place.
 *
 * Mounted the way `CartesianChart` is — measuring view, canvas, the provider
 * **inside** the canvas, an overlay for touch — and for the same reasons; see
 * that root. The one difference is the gesture: a pie has no scrub, so the
 * overlay appears only when `onSlicePress` is given, and it carries a tap.
 *
 * The tap runs its callback on the JavaScript thread (`runOnJS(true)`). A
 * scrub reads a shared value every frame of a drag and has to stay on the UI
 * thread; a tap fires once, its result goes straight into React state, and
 * hopping threads to compute an index nobody reads on the UI side would be a
 * hop for nothing.
 */
export function PolarChart<Row extends ChartRow, const VK extends ValueKeyOf<Row>, const LK extends LabelKeyOf<Row>>(
	props: PolarChartProps<Row, VK, LK>
): ReactElement {
	const { data, valueKey, labelKey, children, onSlicePress, ...rest } = props;

	const { size, onLayout } = useCanvasSize();

	const model = usePolarModel({
		...rest,
		data: data as readonly ChartRow[],
		valueKey,
		labelKey,
		canvas: size,
	});

	const gesture = useSliceTap(model, onSlicePress);

	const content = typeof children === "function" ? children({ ...model, data } as PolarRenderArgs<Row>) : children;

	return (
		<View onLayout={onLayout} style={styles.root}>
			<Canvas style={StyleSheet.absoluteFill}>
				<PolarChartContext.Provider value={model}>{content}</PolarChartContext.Provider>
			</Canvas>
			{gesture === null ? null : <ChartGestureOverlay gesture={gesture} />}
		</View>
	);
}

PolarChart.displayName = "DelacourCharts.PolarChart";

/**
 * A tap that reports the slice under the finger, or `null` when there is none.
 *
 * The callback is read through a ref so an inline arrow — the usual way to
 * pass it — does not rebuild the gesture on every render, and the gesture is
 * keyed on the model so a data change is picked up by the next tap.
 */
function useSliceTap(
	model: PolarContextValue,
	onSlicePress: ((index: number | null) => void) | undefined
): GestureType | null {
	const handler = useRef(onSlicePress);
	handler.current = onSlicePress;
	const enabled = onSlicePress !== undefined;

	return useMemo(() => {
		if (!enabled) return null;
		const { center, innerRadius, radius, slices } = model;
		const starts = slices.map((slice) => slice.startAngle);
		const sweeps = slices.map((slice) => slice.sweepAngle);
		return Gesture.Tap()
			.runOnJS(true)
			.onEnd((event, success) => {
				if (!success) return;
				const index = sliceIndexAt(event.x, event.y, center.x, center.y, innerRadius, radius, starts, sweeps);
				handler.current?.(index === -1 ? null : index);
			});
	}, [enabled, model]);
}

const styles = StyleSheet.create({
	root: { flex: 1, overflow: "hidden" },
});
