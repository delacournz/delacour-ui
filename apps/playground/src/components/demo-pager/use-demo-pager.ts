import { playHaptic } from "delacour-react-native-ui/pressable";
import { type ScreenScrollViewRef, useScreen } from "delacour-react-native-ui/screen";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
	type AnimatedRef,
	type DerivedValue,
	useAnimatedReaction,
	useAnimatedRef,
	useDerivedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type DemoPagerGeometry = {
	/** The scroll view the pages live in, for a programmatic jump. */
	scrollRef: AnimatedRef<ScreenScrollViewRef>;
	/** One page's height — the scroll viewport. 0 until the first layout lands. */
	pageHeight: number;
	onFrameLayout: (event: LayoutChangeEvent) => void;
	/** Position in pages, continuous: 2.4 is 40% of the way from page 3 to page 4. */
	progress: DerivedValue<number>;
	/** The settled page, as JS state, for the parts that have to re-render. */
	activeIndex: number;
	scrollToIndex: (index: number) => void;
	/** Re-snaps a landing that missed a page boundary. Wire to `onMomentumScrollEnd`. */
	onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

/**
 * The pager's geometry, read off the screen the pages are already scrolling.
 *
 * **`scrollY` comes from the screen context, not from an `onScroll` prop.**
 * `Screen.ScrollArea` wires its own `onScroll` — the handler that animates the
 * navbar and footer spacer views — *before* it spreads a caller's props, so
 * passing one here would silently replace it and break every inset on the
 * screen. The handler already publishes the offset into the context, so reading
 * it there costs nothing and cannot clash.
 *
 * The ref exists for one caller: the index sheet, which jumps to a demo by
 * name. Nothing drives the scroll view from the UI thread any more — the rail
 * reports position and takes no gesture — so this is an ordinary JS-thread
 * `scrollTo` on the instance `Screen.ScrollArea` hands back.
 *
 * **The page height is the scroll viewport, measured rather than derived.**
 * With a `static` navbar and a `static` footer both insets resolve to zero
 * (`resolveScrollTopInset` returns 0 for a static navbar, `resolveScrollBottomInset`
 * returns the keyboard band alone for a static footer), so the scroll area's own
 * frame *is* the clear band and `pagingEnabled` snaps to exactly one demo. Move
 * either piece of chrome to `overlay` and that stops being true — the spacers
 * come back, and every page after the first snaps under the navbar.
 *
 * The settled index is mirrored to JS through an animated reaction rather than
 * read from the shared value in a memo. A `.value` captured in a render-phase
 * closure becomes a memo-cache dependency once React Compiler is on, which
 * Reanimated's strict mode rejects.
 *
 * That same reaction is where the settle haptic lives, so it fires once per
 * page however the page was reached — a swipe, or a row in the index sheet —
 * rather than being wired separately at both.
 *
 * `playHaptic` is called rather than scheduled: it carries its own `"worklet"`
 * directive and belongs on the UI thread, so handing it to `scheduleOnRN` throws
 * at the first page change rather than failing quietly. The index mirror beside
 * it is the opposite case — plain React state, and it does need scheduling.
 *
 * **Two things re-snap the offset, because `pagingEnabled` alone does not hold it.**
 * The scroll content ends with the screen's bottom inset, so it is not an exact
 * multiple of the page height — and UIKit pages by exactly one viewport from
 * wherever the finger let go. Land on the last page, which clamps to the end of
 * the content, and every page you swipe back to sits an inset's worth low; the
 * momentum handler measures the landing and scrolls the remainder. The frame can
 * also change height while the offset stays put — the customizer restyles the
 * navbar and the header above the pager — so a height change re-scrolls to the
 * settled page under the new geometry.
 */
export function useDemoPager(count: number): DemoPagerGeometry {
	const { scrollY } = useScreen();
	const scrollRef = useAnimatedRef<ScreenScrollViewRef>();
	const [pageHeight, setPageHeight] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);

	const onFrameLayout = useCallback((event: LayoutChangeEvent) => {
		const { height } = event.nativeEvent.layout;
		setPageHeight((current) => (Math.abs(current - height) < 1 ? current : height));
	}, []);

	const progress = useDerivedValue(() => (pageHeight > 0 ? scrollY.value / pageHeight : 0), [pageHeight]);

	useAnimatedReaction(
		() => Math.min(Math.max(Math.round(progress.value), 0), count - 1),
		(current, previous) => {
			if (previous === null || current === previous) return;
			scheduleOnRN(setActiveIndex, current);
			playHaptic("selection");
		},
		[count]
	);

	const scrollToIndex = useCallback(
		(index: number) => {
			scrollRef.current?.scrollTo({ animated: true, y: index * pageHeight });
		},
		[pageHeight, scrollRef]
	);

	// A ref, so the height effect below re-runs on a height change and never on
	// a page change — scrolling to the settled page on every settle would fight
	// the swipe that is settling it.
	const activeIndexRef = useRef(activeIndex);
	activeIndexRef.current = activeIndex;

	useEffect(() => {
		if (pageHeight <= 0) return;
		scrollRef.current?.scrollTo({ animated: false, y: activeIndexRef.current * pageHeight });
	}, [pageHeight, scrollRef]);

	const onMomentumScrollEnd = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			if (pageHeight <= 0) return;
			const y = event.nativeEvent.contentOffset.y;
			const index = Math.min(Math.max(Math.round(y / pageHeight), 0), count - 1);
			const target = index * pageHeight;
			if (Math.abs(y - target) < 0.5) return;
			scrollRef.current?.scrollTo({ animated: true, y: target });
		},
		[count, pageHeight, scrollRef]
	);

	return { activeIndex, onFrameLayout, onMomentumScrollEnd, pageHeight, progress, scrollRef, scrollToIndex };
}
