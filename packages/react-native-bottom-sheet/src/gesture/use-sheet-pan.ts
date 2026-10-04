import { useMemo } from "react";
import { Gesture, type GestureType, type PanGesture } from "react-native-gesture-handler";
import { KeyboardController } from "react-native-keyboard-controller";
import { cancelAnimation, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { AnimateTo, SettleAt } from "../animation/animation.types";
import {
	crossedSnapPoint,
	GESTURE_SOURCE,
	type GestureSource,
	listDragHeight,
	listOwnsRelease,
	resistOverDrag,
	restingSnapPoint,
	SCROLLABLE_TYPE,
	selectSnapHeight,
	snapPointUnder,
} from "../core";
import { ANIM_STATUS, type SheetGeometry, type SheetSharedState } from "../state/state.types";
import {
	CONTENT_ACTIVE_OFFSET_Y,
	CONTENT_FAIL_OFFSET_X,
	type SheetPanOptions,
	type SheetPans,
	SNAP_PROJECTION,
} from "./gesture.types";

type PanEvent = { translationY: number; velocityY: number };

/** Settle tolerance: a sheet within this of a snap point is on it. */
const AT_SNAP_POINT = 0.5;

/** JS-thread, so `scheduleOnRN` has a plain function to call; `dismiss` returns a promise nobody awaits. */
function dismissKeyboard(): void {
	void KeyboardController.dismiss();
}

/**
 * The two pans — handle and content — sharing one set of handlers.
 *
 * Everything runs on the UI thread. `onStart` cancels whatever animation owns
 * `base` and remembers where the drag began; `onChange` turns the finger's
 * travel into a height, rubber-banded past the snap points by `resistOverDrag`
 * and never above the container; `onFinalize` picks the snap point the finger was
 * heading for with `selectSnapHeight` and hands it to `animateTo` with the
 * release velocity. The close is a candidate only when `enablePanDownToClose`.
 *
 * A content pan the list owns at release — the sheet at its top, the list
 * scrolled — does not snap, but it still settles: the finger moved `base` by
 * hand, so no animation ran and nothing else writes `currentIndex`. `settleAt`
 * on the snap point under `base` is the bookkeeping of a finished animation
 * without the motion; between snap points (which the list ownership test should
 * rule out) the sheet snaps to the nearest one with no velocity instead, since
 * the release velocity is the list's momentum.
 *
 * The content pan waits six points of vertical travel before it claims a
 * touch and gives up after twelve horizontal, so a tap lands on the button or
 * the field under it and a horizontal pager inside the sheet keeps its swipe.
 * The handle pan claims immediately — nothing under a grabber wants the touch.
 *
 * The handlers are built inside this `useMemo`, so they close over the core's
 * worklets in the ordinary way. See the package `AGENTS.md`: that is legal
 * precisely because these are not module-scope worklets.
 *
 * Per-gesture memory — where the drag began, the snap point last under it,
 * whether it is over-dragging — lives in shared values rather than closure
 * variables. Each worklet gets its own copy of a captured `let`, so a write in
 * `onStart` would never be seen by `onChange`.
 */
export function useSheetPan(
	state: SheetSharedState,
	geometry: SheetGeometry,
	animateTo: AnimateTo,
	settleAt: SettleAt,
	options: SheetPanOptions
): SheetPans {
	const startBase = useSharedValue(0);
	const lastSnapPoint = useSharedValue(-1);
	const overDragging = useSharedValue(false);
	const startScroll = useSharedValue(0);
	const listHeld = useSharedValue(false);
	const {
		enableHandlePanningGesture,
		enableContentPanningGesture,
		onSnapPointHaptic,
		onCloseHaptic,
		onOverDragHaptic,
	} = options;

	return useMemo(() => {
		const begin = (source: GestureSource): void => {
			"worklet";
			cancelAnimation(state.base);
			state.animStatus.value = ANIM_STATUS.IDLE;
			state.gestureSource.value = source;
			startBase.value = state.base.value;
			startScroll.value = state.scrollOffsetY.value;
			// A list scrolled and below the top is held by the lock: it has no travel
			// to spend until the sheet reaches the highest snap point.
			listHeld.value = state.scrollOffsetY.value > 0 && state.base.value < geometry.highest.value - AT_SNAP_POINT;
			lastSnapPoint.value = snapPointUnder(state.base.value, geometry.snapPoints.value);
			overDragging.value = false;
			// A finger on the sheet is a reason to put the keyboard away; the lift
			// comes off as it goes and the drag continues from wherever `base` is.
			if (state.config.value.enableBlurKeyboardOnGesture && state.keyboardProgress.value > 0) {
				scheduleOnRN(dismissKeyboard);
			}
		};

		const haptics = (
			raw: number,
			next: number,
			lowest: number,
			highest: number,
			snapPoints: readonly number[]
		): void => {
			"worklet";
			const over = raw > highest || raw < lowest;
			if (over && !overDragging.value && onOverDragHaptic) onOverDragHaptic();
			overDragging.value = over;

			if (crossedSnapPoint(lastSnapPoint.value, next, snapPoints)) {
				lastSnapPoint.value = snapPointUnder(next, snapPoints);
				if (onSnapPointHaptic) onSnapPointHaptic();
			}
		};

		// Whether this pan is a content pan over a registered scrollable.
		const overList = (source: GestureSource): boolean => {
			"worklet";
			return source === GESTURE_SOURCE.CONTENT && state.scrollableType.value !== SCROLLABLE_TYPE.NONE;
		};

		// The finger's travel as a height. Over a list the offset the list began
		// with is a budget spent before the sheet moves — see `listDragHeight`.
		const dragged = (translationY: number, highest: number): number => {
			"worklet";
			if (!overList(state.gestureSource.value)) return startBase.value - translationY;
			return listDragHeight({
				startBase: startBase.value,
				translationY,
				startOffset: startScroll.value,
				held: listHeld.value,
				highest,
			});
		};

		const move = (event: PanEvent): void => {
			"worklet";
			if (state.gestureSource.value === GESTURE_SOURCE.NONE) return;
			const config = state.config.value;
			const snapPoints = geometry.snapPoints.value;
			const closed = geometry.closedHeight.value;
			const highest = geometry.highest.value;
			const raw = dragged(event.translationY, highest);

			const lowest = config.enablePanDownToClose || snapPoints.length === 0 ? closed : (snapPoints[0] as number);
			const factor = config.enableOverDrag ? config.overDragResistanceFactor : 0;
			const next = Math.min(resistOverDrag(raw, lowest, highest, factor), geometry.maxHeight.value);

			haptics(raw, next, lowest, highest, snapPoints);
			state.base.value = next;
			if (listHeld.value && next >= highest - AT_SNAP_POINT) listHeld.value = false;
		};

		// The haptic for a close, the keyboard for a downward release — a release
		// heading down under an open keyboard puts the keyboard away whatever
		// `enableBlurKeyboardOnGesture` says — then the animation.
		const settle = (target: number, closed: number, velocity: number): void => {
			"worklet";
			if (target <= closed && onCloseHaptic) onCloseHaptic();
			if (target < startBase.value && state.keyboardProgress.value > 0) scheduleOnRN(dismissKeyboard);
			animateTo(target, "gesture", velocity / 2);
		};

		// A release the list owns settles the sheet on the snap point under `base`
		// with no motion; `false` when it sits between snap points and has to snap.
		const settleResting = (): boolean => {
			"worklet";
			const resting = restingSnapPoint(state.base.value, geometry.snapPoints.value);
			if (resting === null) return false;
			settleAt(resting, "gesture");
			return true;
		};

		const release = (event: PanEvent): void => {
			"worklet";
			if (state.gestureSource.value === GESTURE_SOURCE.NONE) return;
			const source = state.gestureSource.value;
			state.gestureSource.value = GESTURE_SOURCE.NONE;
			const config = state.config.value;
			const closed = geometry.closedHeight.value;

			// The finger was scrolling rows at the top snap point: the release is the
			// list's momentum, not a snap — but the sheet still settles where it is.
			const listOwns = listOwnsRelease({
				scrollable: overList(source),
				offset: state.scrollOffsetY.value,
				base: state.base.value,
				highest: geometry.highest.value,
			});
			if (listOwns && settleResting()) return;

			// A list-owned release between snap points (which `listOwnsRelease` should
			// rule out) snaps to the nearest with no velocity and never closes.
			const velocity = listOwns ? 0 : -event.velocityY;
			const target = selectSnapHeight({
				height: state.base.value,
				velocity,
				snapPoints: geometry.snapPoints.value,
				closedHeight: config.enablePanDownToClose && !listOwns ? closed : null,
				projection: SNAP_PROJECTION,
			});

			settle(target, closed, velocity);
		};

		const attach = (pan: PanGesture, source: GestureSource, enabled: boolean): GestureType =>
			pan
				.enabled(enabled)
				.shouldCancelWhenOutside(false)
				.onStart(() => {
					"worklet";
					begin(source);
				})
				.onChange((event) => {
					"worklet";
					move(event);
				})
				.onFinalize((event) => {
					"worklet";
					release(event);
				});

		const handle = attach(Gesture.Pan(), GESTURE_SOURCE.HANDLE, enableHandlePanningGesture);
		const content = attach(
			Gesture.Pan()
				.activeOffsetY([-CONTENT_ACTIVE_OFFSET_Y, CONTENT_ACTIVE_OFFSET_Y])
				.failOffsetX([-CONTENT_FAIL_OFFSET_X, CONTENT_FAIL_OFFSET_X]),
			GESTURE_SOURCE.CONTENT,
			enableContentPanningGesture
		);

		return { handle, content };
	}, [
		state,
		geometry,
		animateTo,
		settleAt,
		startBase,
		startScroll,
		listHeld,
		lastSnapPoint,
		overDragging,
		enableHandlePanningGesture,
		enableContentPanningGesture,
		onSnapPointHaptic,
		onCloseHaptic,
		onOverDragHaptic,
	]);
}
