import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import {
	GestureDetector,
	type GestureDetectorProps,
	type GestureType,
	type LegacyComposedGesture,
} from "react-native-gesture-handler";

/**
 * The touch surface, laid over the canvas.
 *
 * Gestures are handled by an ordinary React Native view rather than by the
 * Skia canvas, because a canvas has no touch targets to speak of — it is one
 * view however much is drawn on it. An absolute-fill sibling keeps the hit
 * area exactly the chart's bounds and keeps gesture composition ordinary.
 *
 * Generic over the gesture's own types rather than typed as a union of the two
 * the engine builds: Gesture Handler 3 infers its detector's props from the one
 * gesture it is handed, and a `PanGesture | TapGesture` infers neither.
 */
export function ChartGestureOverlay<TConfig, THandlerData, TExtendedHandlerData extends THandlerData>({
	gesture,
}: {
	readonly gesture: Exclude<
		GestureDetectorProps<TConfig, THandlerData, TExtendedHandlerData>["gesture"],
		GestureType | LegacyComposedGesture | undefined
	>;
}): ReactElement {
	return (
		<GestureDetector gesture={gesture}>
			<View style={StyleSheet.absoluteFill} />
		</GestureDetector>
	);
}

ChartGestureOverlay.displayName = "DelacourCharts.GestureOverlay";
