import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetBackgroundProps } from "./bottom-sheet.types";

/**
 * The panel's surface: an absolute fill behind the handle and the body that
 * takes no touches. Colour, radius and shadow arrive as `style` — this is
 * where a skin puts `rounded-t-2xl bg-popover`, and a detached sheet rounds
 * every corner here.
 *
 * The panel is as tall as the frame, so an attached surface fills it and its
 * bottom edge is always off-screen. A detached card has a visible bottom
 * edge: the surface is then the geometry's `surfaceHeight` tall, on the UI
 * thread — the sheet's height between its snap points, and the nearest snap point's
 * height beyond them — so the corners the skin rounds are on screen, the gap
 * under the card is the overlay's, and a close or an over-drag moves the
 * whole card as one rigid body rather than shrinking it onto the resting
 * line.
 */
export function BottomSheetBackground({ style, ref, ...props }: BottomSheetBackgroundProps): ReactElement {
	const { geometry, detached } = useBottomSheetInternal();
	const surface = geometry.surfaceHeight;
	const isDetached = detached !== null;

	const sized = useAnimatedStyle(() => {
		if (!isDetached) return { bottom: 0, height: undefined };
		return { bottom: undefined, height: surface.value };
	});

	return <Animated.View pointerEvents="none" ref={ref} style={[StyleSheet.absoluteFill, style, sized]} {...props} />;
}
BottomSheetBackground.displayName = "DelacourBottomSheet.BottomSheet.Background";
