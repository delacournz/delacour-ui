import { useMemo } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from "react-native";
import {
	type AnimatedRef,
	type SharedValue,
	scrollTo,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedScrollHandler,
	useDerivedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GESTURE_SOURCE, scrollLockTarget, shouldLockScroll } from "../core";
import type { ScrollableHandle } from "../scrollable/scrollable.types";
import type { SheetGeometry, SheetSharedState } from "../state/state.types";

export type ScrollLockOptions = {
	/** The root's `enableContentPanningGesture`. Off, the list is never locked — nothing else could take the drag. */
	enableContentPan: boolean;
	/** The caller's `showsVerticalScrollIndicator`; shown only while unlocked. @default true */
	showsVerticalScrollIndicator?: boolean;
	/** The caller's `bounces`; on only while unlocked. @default true */
	bounces?: boolean;
	/** The caller's `decelerationRate`; `0` while locked. @default "normal" */
	decelerationRate?: ScrollViewProps["decelerationRate"];
	/** The caller's own scroll callbacks, called on the JS thread with the event the worklet saw. */
	listeners?: ScrollListeners;
};

type ScrollListener = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

export type ScrollListeners = Pick<
	{ [K in keyof ScrollViewProps]?: ScrollListener },
	"onScroll" | "onScrollBeginDrag" | "onScrollEndDrag" | "onMomentumScrollEnd"
>;

type ScrollLockProps = Pick<ScrollViewProps, "decelerationRate" | "showsVerticalScrollIndicator" | "bounces">;

export type ScrollLock = {
	/** `true` while the sheet is below its highest detent: the list is held at `scrollLockedAt`. */
	locked: SharedValue<boolean>;
	/** For the list's `onScroll`. Tracks the offset into `scrollOffsetY` and enforces the lock. */
	scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
	/** For the list's `animatedProps`: deceleration, indicator and bounce, switched by the lock. */
	animatedProps: Partial<ScrollLockProps>;
};

/**
 * The scroll lock: the UI-thread half of a scrollable body.
 *
 * Below the highest detent a drag on the list must move the sheet, not the
 * rows. The content pan already does the moving — the native scroll and the
 * pan are simultaneous — so this hook's job is to make sure the list does not
 * *also* move: every scroll event while locked is answered with a `scrollTo`
 * back to where the lock engaged, and the offset the pan reads is pinned
 * there too, so the pan sees the list consume nothing.
 *
 * The lock engages when the sheet leaves its highest detent by any path — a
 * drag, a `snapToIndex`, a keyboard — and takes the offset of that moment as
 * its target. A list scrolled a hundred pixels, then collapsed by the handle,
 * holds those hundred pixels rather than jumping to the top; when the sheet
 * comes back up it continues from there.
 *
 * The animated props do the rest: `decelerationRate: 0` while locked so a
 * fling has no momentum for the lock to fight, the indicator hidden so a
 * pinned list does not flash a bar, and `bounces` off so a pull-down at the
 * top rubber-bands the sheet and not the rows.
 */
export function useScrollLock(
	state: SheetSharedState,
	geometry: SheetGeometry,
	ref: AnimatedRef<ScrollableHandle>,
	options: ScrollLockOptions
): ScrollLock {
	const {
		enableContentPan,
		showsVerticalScrollIndicator = true,
		bounces = true,
		decelerationRate = "normal",
		listeners,
	} = options;
	const onScroll = listeners?.onScroll;
	const onScrollBeginDrag = listeners?.onScrollBeginDrag;
	const onScrollEndDrag = listeners?.onScrollEndDrag;
	const onMomentumScrollEnd = listeners?.onMomentumScrollEnd;
	const { scrollOffsetY, scrollLockedAt } = state;
	const sheetState = geometry.sheetState;

	const locked = useDerivedValue(() => shouldLockScroll(sheetState.value, enableContentPan));

	useAnimatedReaction(
		() => locked.value,
		(now, before) => {
			if (now && before !== true) {
				scrollLockedAt.value = scrollLockTarget(
					scrollOffsetY.value,
					state.gestureSource.value === GESTURE_SOURCE.CONTENT
				);
			}
		}
	);

	const scrollHandler = useAnimatedScrollHandler(
		useMemo(() => {
			const track = (event: NativeScrollEvent, listener: ScrollListener | undefined): void => {
				"worklet";
				if (listener) scheduleOnRN(listener, { nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
				if (locked.value) {
					const target = scrollLockedAt.value;
					scrollTo(ref, 0, target, false);
					scrollOffsetY.value = target;
					return;
				}
				scrollOffsetY.value = event.contentOffset.y;
			};
			return {
				onScroll: (event) => {
					"worklet";
					track(event, onScroll);
				},
				onBeginDrag: (event) => {
					"worklet";
					track(event, onScrollBeginDrag);
				},
				onEndDrag: (event) => {
					"worklet";
					track(event, onScrollEndDrag);
				},
				onMomentumEnd: (event) => {
					"worklet";
					track(event, onMomentumScrollEnd);
				},
			};
		}, [locked, scrollLockedAt, scrollOffsetY, ref, onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd])
	);

	const animatedProps = useAnimatedProps<ScrollLockProps>(() => ({
		decelerationRate: locked.value ? 0 : decelerationRate,
		showsVerticalScrollIndicator: showsVerticalScrollIndicator && !locked.value,
		bounces: bounces && !locked.value,
	}));

	return useMemo(() => ({ locked, scrollHandler, animatedProps }), [locked, scrollHandler, animatedProps]);
}
