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
 * Three boxes. The outermost is the content pan's detector and the clip: its
 * `maxHeight` follows the geometry's `bodyClip` on the UI thread, so under a
 * sticky footer nothing of the body is drawn below the footer's top edge, at
 * rest or while the sheet is dragged below its snap point and the footer holds
 * the screen's bottom. The middle box is the layout: `contentArea` plus the
 * `bodyInset` the body reserves at its end, which reaches the sheet's bottom
 * line, and it never reflows during a snap between snap points. The innermost is
 * the caller's — it takes the `style` — and its measured height is what a
 * sheet sized to its content grows to. Yoga lays the inner box out at its
 * natural height whatever the outer clamps say, which is what makes the
 * measurement honest.
 *
 * A trailing spacer the height of the body's inset — the sticky footer, band
 * included, or the band alone — keeps the last line of content above either,
 * and `footerGap` adds to it above a footer.
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
	const { contentArea, bodyInset, bodyClip, layoutReady, surfaceHeight } = geometry;
	const isDetached = detached !== null;

	// A detached card's surface is only as tall as the sheet, so its body is
	// also held to what the surface shows, or the opening animation would draw
	// the body under the card. The surface keeps its snap point's height while the
	// card slides closed, so the body slides with it, unchanged.
	const clip = useAnimatedStyle(() => {
		if (!layoutReady.value) return { maxHeight: UNCLAMPED };
		let height = bodyClip.value;
		if (isDetached) {
			const shown = surfaceHeight.value - state.handleHeight.value;
			height = Math.min(height, shown > 0 ? shown : 0);
		}
		return { maxHeight: height };
	});

	// A ceiling, so the body keeps its natural height under it — except under
	// `fillParent`, where the body is the space above the keyboard and a flex
	// child inside it is meant to shrink to fit.
	const layout = useAnimatedStyle(() => {
		const area = layoutReady.value ? contentArea.value + bodyInset.value : UNCLAMPED;
		return state.config.value.keyboardBehavior === "fillParent" && layoutReady.value
			? { height: area, maxHeight: area }
			: { height: undefined, maxHeight: area };
	});

	const spacer = useAnimatedStyle(() => ({
		height: bodyInset.value + (state.config.value.hasFooter ? footerGap : 0),
	}));

	return (
		<GestureDetector gesture={pans.content}>
			<Animated.View style={[styles.clip, clip]}>
				<Animated.View style={layout}>
					<View onLayout={onLayout} ref={ref} style={style} {...props}>
						{children}
					</View>
					<Animated.View style={spacer} />
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
}
BottomSheetContent.displayName = "DelacourBottomSheet.BottomSheet.Content";

const styles = StyleSheet.create({
	clip: { overflow: "hidden" },
});
