import { type ComponentType, type ReactElement, type Ref, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAnimatedRef, useAnimatedStyle } from "react-native-reanimated";
import { useBottomSheetInternal } from "../components/bottom-sheet.context";
import { type ScrollableType, UNMEASURED } from "../core";
import { useScrollLock } from "../gesture/use-scroll-lock";
import { composeRefs } from "../lib/compose-refs";
import type {
	BottomSheetScrollableProps,
	ScrollableHandle,
	ScrollableInnerComponent,
	ScrollableInnerProps,
} from "./scrollable.types";

/**
 * Before the first layout there is no content area to clamp to, and a
 * `maxHeight` of zero would clip the list while it measures itself. Tall
 * enough that no sheet reaches it.
 */
const UNCLAMPED = 100_000;

/** How often the list reports its offset, in milliseconds — every frame. */
const SCROLL_EVENT_THROTTLE = 16;

type ScrollableProps = ScrollableInnerProps & BottomSheetScrollableProps;

/**
 * Wraps an animated scrollable as a sheet body.
 *
 * The component passed in must already be animated — `Animated.ScrollView`,
 * `Animated.FlatList`, or the result of `Animated.createAnimatedComponent`
 * made **once, at module scope** — because the wrapper drives it with
 * `animatedProps` and an animated `onScroll`, and because a component created
 * inside a render remounts its subtree every frame.
 *
 * What the wrapper does, top to bottom:
 *
 * - Two gesture detectors. The outer is the sheet's content pan, the same
 *   object `Content` uses; the inner is a `Native` gesture on the list itself,
 *   declared simultaneous with that pan and kept alive when the finger leaves
 *   the view. Both run at once, and the pan subtracts what the list consumed.
 * - The scroll lock (`useScrollLock`). Below the highest detent the list is
 *   held where it was, so the pan moves the sheet; at the highest it scrolls,
 *   and a drag down at the top hands back to the sheet. The indicator hides,
 *   bounce switches off and momentum is cut while locked.
 * - The clamp. `maxHeight` follows the geometry's `contentArea` on the UI
 *   thread, so the list never runs under the footer or the keyboard, and
 *   `marginBottom` follows the footer's height so the list's last row and its
 *   indicator stop above a sticky footer.
 * - Content size. `onContentSizeChange` feeds `contentHeight`, which is the
 *   dynamic detent's measurement: a `ScrollView` of forty rows needs no
 *   `snapPoints` and no `dynamicSizing={false}` — it sizes to its rows up to
 *   `maxDynamicContentSize`, then scrolls.
 * - Registration. On focus the list tells the sheet what kind it is, and on
 *   blur it withdraws and the offset resets; `focusHook` is where a navigator's
 *   `useFocusEffect` goes.
 *
 * `contentContainerStyle` is flattened to one object before it reaches the
 * list: a virtualised list measures its content container, and an array style
 * makes that measurement lag a frame behind the layout.
 *
 * Refresh control is out of scope here — a `refreshControl` prop passes
 * through untouched, but a pull-to-refresh at the top of a locked list fights
 * the sheet's own pull-down, and no rule for that is written yet.
 */
export function createBottomSheetScrollable<P extends object>(
	Scrollable: ComponentType<P>,
	type: ScrollableType
): ComponentType<P & BottomSheetScrollableProps> {
	// The wrapper reads and writes the props every React Native scrollable
	// shares and passes the rest through, so it is written once against that
	// common shape; the built-ins restate their own generic signatures.
	const Inner = Scrollable as unknown as ScrollableInnerComponent;

	function BottomSheetScrollable({
		focusHook = useEffect,
		ref,
		style,
		contentContainerStyle,
		onContentSizeChange,
		onScroll,
		onScrollBeginDrag,
		onScrollEndDrag,
		onMomentumScrollEnd,
		showsVerticalScrollIndicator,
		bounces,
		decelerationRate,
		...rest
	}: ScrollableProps): ReactElement {
		const { state, geometry, pans, enableContentPanningGesture, setScrollableRef, removeScrollableRef } =
			useBottomSheetInternal();
		const { contentArea, footerHeight, layoutReady } = geometry;
		const animatedRef = useAnimatedRef<ScrollableHandle>();

		const { scrollHandler, animatedProps } = useScrollLock(state, geometry, animatedRef, {
			enableContentPan: enableContentPanningGesture,
			showsVerticalScrollIndicator,
			bounces,
			decelerationRate,
			listeners: { onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd },
		});

		const native = useMemo(
			() => Gesture.Native().simultaneousWithExternalGesture(pans.content).shouldCancelWhenOutside(false),
			[pans.content]
		);

		const composedRef = useMemo(
			() => composeRefs<ScrollableHandle>(animatedRef as unknown as Ref<ScrollableHandle>, ref),
			[animatedRef, ref]
		);

		const clamp = useAnimatedStyle(() => ({
			maxHeight: layoutReady.value ? contentArea.value : UNCLAMPED,
			marginBottom: footerHeight.value,
		}));

		const handleContentSizeChange = useCallback(
			(width: number, height: number) => {
				if (state.contentHeight.value !== height) state.contentHeight.value = height;
				if (onContentSizeChange) onContentSizeChange(width, height);
			},
			[state, onContentSizeChange]
		);

		useEffect(
			() => () => {
				state.contentHeight.value = UNMEASURED;
			},
			[state]
		);

		const register = useCallback(() => {
			setScrollableRef(animatedRef, type);
			return () => removeScrollableRef(animatedRef);
		}, [setScrollableRef, removeScrollableRef, animatedRef]);
		focusHook(register, [register]);

		return (
			<GestureDetector gesture={pans.content}>
				<View style={styles.outer}>
					<GestureDetector gesture={native}>
						<Inner
							{...rest}
							animatedProps={animatedProps}
							contentContainerStyle={StyleSheet.flatten(contentContainerStyle)}
							keyboardDismissMode="interactive"
							onContentSizeChange={handleContentSizeChange}
							onScroll={scrollHandler}
							overScrollMode="never"
							ref={composedRef}
							scrollEventThrottle={SCROLL_EVENT_THROTTLE}
							style={[style, clamp]}
						/>
					</GestureDetector>
				</View>
			</GestureDetector>
		);
	}
	BottomSheetScrollable.displayName = "DelacourBottomSheet.BottomSheet.Scrollable";

	return BottomSheetScrollable as unknown as ComponentType<P & BottomSheetScrollableProps>;
}

const styles = StyleSheet.create({
	outer: { flexShrink: 1 },
});
