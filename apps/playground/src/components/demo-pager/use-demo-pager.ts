import { playHaptic } from "@delacour/native-ui/pressable";
import { type ScreenScrollViewRef, useScreen } from "@delacour/native-ui/screen";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
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
 * An animated ref rather than a plain one, even though the jump below runs on
 * the JS thread: it is the same ref a UI-thread `scrollTo` needs, and a scrub
 * gesture cannot afford a round trip per frame.
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
 * page however the page was reached — a swipe, a rail scrub, or a row in the
 * index sheet — rather than being wired separately at each of the three.
 *
 * `playHaptic` is called rather than scheduled: it carries its own `"worklet"`
 * directive and belongs on the UI thread, so handing it to `scheduleOnRN` throws
 * at the first page change rather than failing quietly. The index mirror beside
 * it is the opposite case — plain React state, and it does need scheduling.
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

	return { activeIndex, onFrameLayout, pageHeight, progress, scrollRef, scrollToIndex };
}
