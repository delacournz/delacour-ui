import { type ReactElement, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { detachedFrame } from "../core";
import { useBottomSheet, useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetContainerProps } from "./bottom-sheet.types";

/**
 * The panel — the surface that moves.
 *
 * It fills the frame and is translated down by the geometry's `position`, so
 * `height` pixels of it show above the resting bottom line; over-dragged past
 * the top it never uncovers its own bottom edge, because it is as tall as the
 * frame. `Background`, `Handle` and `Content` are written inside it in flow
 * order; the background is an absolute fill, the handle and the body stack.
 *
 * **It is not `accessible`.** An accessible container collapses its whole
 * subtree into one element on iOS, and every field, button and line of copy
 * inside becomes unreachable to VoiceOver. Instead the panel is a modal view
 * while open under an overlay, so a screen reader stays inside it, and its
 * descendants are hidden while it is closed, so the app behind it is what a
 * screen reader finds. The title labels it.
 *
 * A container written without a `Handle` reports a handle height of zero on
 * mount, so a handle-less sheet is not a sheet that never becomes ready.
 */
export function BottomSheetContainer({ children, style, ref, ...props }: BottomSheetContainerProps): ReactElement {
	const { geometry, state, hasOverlay, handleMounted, titleId, detached } = useBottomSheetInternal();
	const { isOpen } = useBottomSheet();
	const position = geometry.position;
	const containerWidth = state.containerWidth;
	const config = state.config;

	useEffect(() => {
		if (!handleMounted.current && state.handleHeight.value < 0) state.handleHeight.value = 0;
	}, [handleMounted, state]);

	// A detached card is inset from the frame's sides by `detachedFrame`; an
	// attached panel spans it. Both on the UI thread, off the measured width,
	// so a rotation re-derives the inset with no render. The panel stays as
	// tall as the frame either way, so it is `box-none` when detached: the
	// surface, the handle and the body take their touches, and a touch in the
	// gap under the card — where only the transparent panel is — falls through
	// to the overlay behind it.
	const animatedStyle = useAnimatedStyle(() => {
		const options = config.value.detached;
		if (options === null || !(containerWidth.value > 0)) {
			return { left: 0, right: 0, width: undefined, transform: [{ translateY: position.value }] };
		}
		const frame = detachedFrame({
			containerWidth: containerWidth.value,
			horizontalMargin: options.horizontalMargin,
			bottomOffset: options.bottomOffset,
			bottomInset: config.value.bottomInset,
		});
		return { left: frame.left, right: undefined, width: frame.width, transform: [{ translateY: position.value }] };
	});

	return (
		<Animated.View
			accessibilityElementsHidden={!isOpen}
			accessibilityLabelledBy={titleId}
			accessibilityViewIsModal={isOpen && hasOverlay}
			importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
			pointerEvents={detached === null ? "auto" : "box-none"}
			ref={ref}
			style={[styles.panel, detached === null ? null : styles.detached, style, animatedStyle]}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
BottomSheetContainer.displayName = "DelacourBottomSheet.BottomSheet.Container";

const styles = StyleSheet.create({
	panel: { bottom: 0, flexDirection: "column", left: 0, position: "absolute", right: 0, top: 0 },
	detached: { overflow: "visible" },
});
