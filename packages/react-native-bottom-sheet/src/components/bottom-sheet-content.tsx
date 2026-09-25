import { type ReactElement, useCallback } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useMeasureHeight } from "../layout/use-measure-height";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetContentProps } from "./bottom-sheet.types";

/**
 * Before the first layout there is no content area to clamp to, and a
 * `maxHeight` of zero would clip the body while it measures itself. Tall
 * enough that no sheet reaches it.
 */
const UNCLAMPED = 100_000;

/**
 * The static body — what a caller writes the title, the copy and the controls
 * into.
 *
 * Two boxes. The outer one is the content pan's detector and is clamped to
 * the geometry's `contentArea` on the UI thread, so the body never runs past
 * the sheet's highest detent, the footer or the keyboard. The inner one is
 * the caller's — it takes the `style` — and its measured height is what a
 * sheet sized to its content grows to. Yoga lays the inner box out at its
 * natural height whatever the outer clamp says, which is what makes the
 * measurement honest.
 *
 * A trailing spacer the height of the sticky footer keeps the last line of
 * content above it, and `footerGap` adds to it. Zero without a sticky footer.
 */
export function BottomSheetContent({
	children,
	style,
	ref,
	footerGap = 0,
	...props
}: BottomSheetContentProps): ReactElement {
	const { state, geometry, pans, detached, contentHeightSource } = useBottomSheetInternal();
	const measure = useMeasureHeight(state.contentHeight);
	// A `Steps` body drives `contentHeight` itself; its layout events here
	// would be the stack mid-animation, a frame stale.
	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (contentHeightSource.current === "steps") return;
			measure(event);
		},
		[contentHeightSource, measure]
	);
	const { contentArea, footerHeight, layoutReady, surfaceHeight } = geometry;
	const isDetached = detached !== null;

	// A ceiling, so the body keeps its natural height under it — except under
	// `fillParent`, where the body is the space above the keyboard and a flex
	// child inside it is meant to shrink to fit. A detached card's surface is
	// only as tall as the sheet, so its body is also held to what the surface
	// shows, or the opening animation would draw the body under the card. The
	// surface keeps its detent's height while the card slides closed, so the
	// body slides with it, unchanged.
	const clamp = useAnimatedStyle(() => {
		let area = layoutReady.value ? contentArea.value : UNCLAMPED;
		if (isDetached && layoutReady.value) {
			const shown = surfaceHeight.value - state.handleHeight.value;
			area = Math.min(area, shown > 0 ? shown : 0);
		}
		return state.config.value.keyboardBehavior === "fillParent" && layoutReady.value
			? { height: area, maxHeight: area }
			: { height: undefined, maxHeight: area };
	});

	const spacer = useAnimatedStyle(() => ({
		height: footerHeight.value > 0 ? footerHeight.value + footerGap : 0,
	}));

	return (
		<GestureDetector gesture={pans.content}>
			<Animated.View style={[styles.outer, clamp]}>
				<View onLayout={onLayout} ref={ref} style={style} {...props}>
					{children}
				</View>
				<Animated.View style={spacer} />
			</Animated.View>
		</GestureDetector>
	);
}
BottomSheetContent.displayName = "DelacourBottomSheet.BottomSheet.Content";

const styles = StyleSheet.create({
	outer: { overflow: "hidden" },
});
