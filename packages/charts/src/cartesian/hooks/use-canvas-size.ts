import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { ChartSize } from "../../core/chart.types";

export const ZERO_SIZE: ChartSize = { width: 0, height: 0 };

export type CanvasSize = {
	readonly size: ChartSize;
	readonly onLayout: (event: LayoutChangeEvent) => void;
	/** False until the first layout pass. Nothing should draw before it. */
	readonly measured: boolean;
};

/**
 * The chart's measured size.
 *
 * Measured on the wrapping React Native view rather than on the canvas.
 * Skia's `<Canvas onLayout>` is deprecated and does not fire on Fabric at all,
 * and its `onSize` alternative reports into a shared value — useful for a
 * worklet, useless for building scales, which happens on the JavaScript
 * thread. A plain `View` reports where the work actually is.
 *
 * The size is held in state, so a resize re-renders and every scale is rebuilt
 * against the new rect. Rounding to whole points keeps a fractional layout
 * from re-rendering the chart on every frame of a parent animation.
 */
export function useCanvasSize(): CanvasSize {
	const [size, setSize] = useState<ChartSize>(ZERO_SIZE);

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		const next = { width: Math.round(width), height: Math.round(height) };
		setSize((current) => (current.width === next.width && current.height === next.height ? current : next));
	}, []);

	return { size, onLayout, measured: size.width > 0 && size.height > 0 };
}
