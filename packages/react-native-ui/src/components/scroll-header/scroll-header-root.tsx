import { type ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { scrollTo, useAnimatedReaction, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { type ScrollEventFields, ScrollSourceProvider, useScrollSource } from "../../hooks/use-scroll-source";
import { ScrollHeaderContext } from "./scroll-header.context";
import type { ScrollHeaderInternalContextValue, ScrollHeaderProps } from "./scroll-header.types";
import {
	isCollapsed as isCollapsedAt,
	resolveCollapseDistance,
	resolveCollapseProgress,
	resolveHeaderInset,
	resolveSnapTarget,
	SCROLL_HEADER_SNAP_VELOCITY,
	scrollHeaderVariants,
} from "./scroll-header.variants";

/**
 * The header's root: owns the scroll source, every derived value the parts animate from, the
 * snap, and the JS mirror of "collapsed" that accessibility reads.
 *
 * **Snap runs through a shared value, not a direct `scrollTo` in the end-of-drag worklet.** The
 * worklets are handed to `useScrollSource`, which is what creates the animated ref — so they
 * cannot close over it. They write the target into `snapTarget`, and a reaction declared after
 * the source, which can see the ref, performs the scroll. Both run on the UI thread.
 *
 * Neither snap path fights a gesture: `onEndDrag` settles only when the release was too slow
 * for momentum to follow, and `onMomentumEnd` only once the fling has stopped.
 */
export function ScrollHeaderRoot({
	threshold = 1,
	snap = true,
	stretch = true,
	onCollapsedChange,
	progress: progressOutput,
	className,
	children,
	onLayout,
	...props
}: ScrollHeaderProps): ReactElement {
	const { top: safeAreaTop } = useSafeAreaInsets();
	const isCalm = useCalmMotion();
	const [hasLarge, setHasLarge] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const scrollerCount = useRef(0);

	const barHeight = useSharedValue(0);
	const largeHeight = useSharedValue(0);
	const snapTarget = useSharedValue<number | null>(null);

	const collapseDistance = useDerivedValue(() =>
		resolveCollapseDistance({ largeHeight: largeHeight.value, threshold })
	);

	const requestSnap = useCallback(
		(event: ScrollEventFields) => {
			"worklet";
			if (!snap) return;
			const target = resolveSnapTarget({ offset: event.contentOffset.y, distance: collapseDistance.value });
			if (target !== null) snapTarget.value = target;
		},
		[snap, collapseDistance, snapTarget]
	);

	const onEndDrag = useCallback(
		(event: ScrollEventFields) => {
			"worklet";
			const velocity = event.velocity?.y ?? 0;
			if (Math.abs(velocity) < SCROLL_HEADER_SNAP_VELOCITY) requestSnap(event);
		},
		[requestSnap]
	);

	const { source, scrollProps } = useScrollSource({ onEndDrag, onMomentumEnd: requestSnap });

	const { offset } = source;
	const progress = useDerivedValue(() => resolveCollapseProgress(offset.value, collapseDistance.value));
	const topInset = useDerivedValue(() =>
		resolveHeaderInset({ safeAreaTop, barHeight: barHeight.value, largeHeight: largeHeight.value })
	);

	// The ref alone: a worklet captures every object it reads a field of, and `scrollProps`
	// carries the scroll handler, which cannot be copied to the UI thread.
	const scrollRef = scrollProps.ref;

	useAnimatedReaction(
		() => snapTarget.value,
		(target) => {
			if (target === null) return;
			scrollTo(scrollRef, 0, target, !isCalm);
			snapTarget.value = null;
		},
		[isCalm, scrollRef]
	);

	const handleCollapsedChange = useCallback(
		(next: boolean) => {
			setIsCollapsed(next);
			onCollapsedChange?.(next);
		},
		[onCollapsedChange]
	);

	// `previous` is null on the first run: a header that mounts open says nothing, one restored
	// to a collapsed offset reports it once.
	useAnimatedReaction(
		() => isCollapsedAt(progress.value),
		(next, previous) => {
			if (next === previous) return;
			if (previous === null && !next) return;
			scheduleOnRN(handleCollapsedChange, next);
		},
		[handleCollapsedChange]
	);

	useAnimatedReaction(
		() => progress.value,
		(value) => {
			if (progressOutput) progressOutput.value = value;
		},
		[progressOutput]
	);

	const registerLarge = useCallback(() => {
		setHasLarge(true);
		return () => {
			setHasLarge(false);
			largeHeight.value = 0;
		};
	}, [largeHeight]);

	const registerScroller = useCallback(() => {
		scrollerCount.current += 1;
		if (__DEV__ && scrollerCount.current > 1) {
			console.warn(
				"[DelacourUI] <ScrollHeader> has more than one scroller mounted. It follows a single scrollable — use one ScrollHeader.ScrollView, ScrollHeader.FlatList or useScrollHeader() scroller."
			);
		}
		return () => {
			scrollerCount.current -= 1;
		};
	}, []);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			if (__DEV__ && event.nativeEvent.layout.height === 0) {
				console.warn(
					"[DelacourUI] <ScrollHeader> measured 0 tall. Give it a height — `flex-1` inside a flex parent, or a fixed height."
				);
			}
		},
		[onLayout]
	);

	const value = useMemo<ScrollHeaderInternalContextValue>(
		() => ({
			source,
			scrollProps,
			progress,
			collapseDistance,
			topInset,
			safeAreaTop,
			barHeight,
			largeHeight,
			hasLarge,
			isCollapsed,
			isStretchEnabled: stretch && !isCalm,
			registerLarge,
			registerScroller,
		}),
		[
			source,
			scrollProps,
			progress,
			collapseDistance,
			topInset,
			safeAreaTop,
			barHeight,
			largeHeight,
			hasLarge,
			isCollapsed,
			stretch,
			isCalm,
			registerLarge,
			registerScroller,
		]
	);

	return (
		<ScrollHeaderContext value={value}>
			<ScrollSourceProvider source={source}>
				<View className={scrollHeaderVariants().root({ className })} onLayout={handleLayout} {...props}>
					{children}
				</View>
			</ScrollSourceProvider>
		</ScrollHeaderContext>
	);
}
