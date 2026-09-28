import {
	type ComponentType,
	createElement,
	isValidElement,
	type ReactElement,
	type Ref,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import { GestureDetector, useNativeGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedRef, useAnimatedStyle } from "react-native-reanimated";
import { useBottomSheetInternal } from "../components/bottom-sheet.context";
import { SCROLLABLE_TYPE, type ScrollableType, scrollContentHeight, UNMEASURED } from "../core";
import { useScrollLock } from "../gesture/use-scroll-lock";
import { composeRefs } from "../lib/compose-refs";
import type {
	BottomSheetScrollableProps,
	ScrollableHandle,
	ScrollableInnerComponent,
	ScrollableInnerProps,
	ScrollableListFooter,
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

/** A consumer's `ListFooterComponent` — an element, a component type, or nothing — as an element. */
function footerElement(footer: ScrollableListFooter | undefined): ReactElement | null {
	if (footer === undefined || footer === null) return null;
	if (isValidElement(footer)) return footer;
	return createElement(footer);
}

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
 * - The sizing. The list fills the body to the sheet's bottom line —
 *   `contentArea + bodyInset` — and reserves the footer or the safe-area band
 *   as a trailing spacer *inside* its content, so the rows scroll under either
 *   and the last row can be brought fully clear of them. The spacer is
 *   animated: it collapses with the band as the keyboard rises. The indicator
 *   is inset by the same amount so it ends above the footer. The outer view
 *   clips to the geometry's `bodyClip`, so under a footer nothing of the list
 *   shows below the footer's top edge, at rest or while the sheet is dragged
 *   down; the list itself does not shrink to that clip (see `styles.list`).
 * - Content size. `onContentSizeChange` less the spacer's own measured height
 *   feeds `contentHeight`, which is the dynamic detent's measurement: a
 *   `ScrollView` of forty rows needs no `snapPoints` and no
 *   `dynamicSizing={false}` — it sizes to its rows up to
 *   `maxDynamicContentSize`, then scrolls. The two layout events land in one
 *   batch and are folded into one write, so the detent never sees the rows
 *   plus the spacer for a frame — a first open resolved on that sum would
 *   animate to it and ignore the correction.
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
	const isScrollView = type === SCROLLABLE_TYPE.SCROLL_VIEW;

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
		scrollIndicatorInsets,
		bounces,
		decelerationRate,
		children,
		ListFooterComponent,
		...rest
	}: ScrollableProps): ReactElement {
		const { state, geometry, pans, enableContentPanningGesture, setScrollableRef, removeScrollableRef } =
			useBottomSheetInternal();
		const { contentArea, bodyInset, bodyClip, layoutReady } = geometry;
		const animatedRef = useAnimatedRef<ScrollableHandle>();

		const { scrollHandler, animatedProps } = useScrollLock(state, geometry, animatedRef, {
			enableContentPan: enableContentPanningGesture,
			showsVerticalScrollIndicator,
			scrollIndicatorInsets,
			indicatorInset: bodyInset,
			bounces,
			decelerationRate,
			listeners: { onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd },
		});

		const native = useNativeGesture(
			useMemo(() => ({ simultaneousWith: pans.content, shouldCancelWhenOutside: false }), [pans.content])
		);

		const composedRef = useMemo(
			() => composeRefs<ScrollableHandle>(animatedRef as unknown as Ref<ScrollableHandle>, ref),
			[animatedRef, ref]
		);

		const clip = useAnimatedStyle(() => ({
			maxHeight: layoutReady.value ? bodyClip.value : UNCLAMPED,
		}));
		const clamp = useAnimatedStyle(() => ({
			maxHeight: layoutReady.value ? contentArea.value + bodyInset.value : UNCLAMPED,
		}));
		const spacer = useAnimatedStyle(() => ({ height: bodyInset.value }));

		// The content size and the spacer's height arrive as two layout events
		// from the same commit; both are kept and one write follows the batch.
		const contentSize = useRef<number | null>(null);
		const spacerHeight = useRef<number | null>(null);
		const flushQueued = useRef(false);
		const flush = useCallback(() => {
			flushQueued.current = false;
			if (contentSize.current === null || spacerHeight.current === null) return;
			const rows = scrollContentHeight(contentSize.current, spacerHeight.current);
			if (state.contentHeight.value !== rows) state.contentHeight.value = rows;
		}, [state]);
		const queueFlush = useCallback(() => {
			if (flushQueued.current) return;
			flushQueued.current = true;
			queueMicrotask(flush);
		}, [flush]);

		const handleContentSizeChange = useCallback(
			(width: number, height: number) => {
				contentSize.current = height;
				queueFlush();
				if (onContentSizeChange) onContentSizeChange(width, height);
			},
			[queueFlush, onContentSizeChange]
		);
		const handleSpacerLayout = useCallback(
			(event: LayoutChangeEvent) => {
				spacerHeight.current = event.nativeEvent.layout.height;
				queueFlush();
			},
			[queueFlush]
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

		const trailing = <Animated.View onLayout={handleSpacerLayout} pointerEvents="none" style={spacer} />;
		const consumerFooter = footerElement(ListFooterComponent);
		const listFooter = isScrollView ? undefined : (
			<>
				{consumerFooter}
				{trailing}
			</>
		);

		return (
			<GestureDetector gesture={pans.content}>
				<Animated.View style={[styles.outer, clip]}>
					<GestureDetector gesture={native}>
						<Inner
							{...rest}
							animatedProps={animatedProps}
							contentContainerStyle={StyleSheet.flatten(contentContainerStyle)}
							keyboardDismissMode="interactive"
							ListFooterComponent={listFooter}
							onContentSizeChange={handleContentSizeChange}
							onScroll={scrollHandler}
							overScrollMode="never"
							ref={composedRef}
							scrollEventThrottle={SCROLL_EVENT_THROTTLE}
							style={[styles.list, style, clamp]}
						>
							{isScrollView ? children : undefined}
							{isScrollView ? trailing : undefined}
						</Inner>
					</GestureDetector>
				</Animated.View>
			</GestureDetector>
		);
	}
	BottomSheetScrollable.displayName = "DelacourBottomSheet.BottomSheet.Scrollable";

	return BottomSheetScrollable as unknown as ComponentType<P & BottomSheetScrollableProps>;
}

// A React Native scrollable ships `flexShrink: 1`, and Yoga would shrink it to
// the clipping wrapper — the footer's top edge — instead of letting it reach
// the sheet's bottom line, which puts the trailing spacer's clearance on top
// of the wrapper's and doubles it. `flexShrink: 0` leaves only `maxHeight` to
// bound it, and the wrapper alone does the clipping.
const styles = StyleSheet.create({
	outer: { flexShrink: 1, overflow: "hidden" },
	list: { flexShrink: 0 },
});
