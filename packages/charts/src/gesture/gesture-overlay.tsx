import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector, type GestureType } from "react-native-gesture-handler";

/**
 * The touch surface, laid over the canvas.
 *
 * Gestures are handled by an ordinary React Native view rather than by the
 * Skia canvas, because a canvas has no touch targets to speak of — it is one
 * view however much is drawn on it. An absolute-fill sibling keeps the hit
 * area exactly the chart's bounds and keeps gesture composition ordinary.
 */
export function ChartGestureOverlay({ gesture }: { readonly gesture: GestureType }): ReactElement {
	return (
		<GestureDetector gesture={gesture}>
			<View style={StyleSheet.absoluteFill} />
		</GestureDetector>
	);
}

ChartGestureOverlay.displayName = "DelacourCharts.GestureOverlay";
