import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
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
 * content above it. Zero until BSHEET-3 mounts a footer.
 */
export function BottomSheetContent({
	children,
	style,
	ref,
	footerGap = 0,
	...props
}: BottomSheetContentProps): ReactElement {
	const { state, geometry, pans } = useBottomSheetInternal();
	const onLayout = useMeasureHeight(state.contentHeight);
	const { contentArea, footerHeight, layoutReady } = geometry;

	const clamp = useAnimatedStyle(() => ({
		maxHeight: layoutReady.value ? contentArea.value : UNCLAMPED,
	}));

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
