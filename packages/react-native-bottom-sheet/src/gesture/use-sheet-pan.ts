import { useMemo } from "react";
import { Gesture, type GestureType, type PanGesture } from "react-native-gesture-handler";
import { cancelAnimation, useSharedValue } from "react-native-reanimated";
import type { AnimateTo } from "../animation/animation.types";
import {
	crossedDetent,
	detentUnder,
	GESTURE_SOURCE,
	type GestureSource,
	resistOverDrag,
	selectSnapHeight,
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

/**
 * The two pans — handle and content — sharing one set of handlers.
 *
 * Everything runs on the UI thread. `onStart` cancels whatever animation owns
 * `base` and remembers where the drag began; `onChange` turns the finger's
 * travel into a height, rubber-banded past the detents by `resistOverDrag`
 * and never above the container; `onFinalize` picks the detent the finger was
 * heading for with `selectSnapHeight` and hands it to `animateTo` with the
 * release velocity. The close is a candidate only when `enablePanDownToClose`.
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
 * Per-gesture memory — where the drag began, the detent last under it,
 * whether it is over-dragging — lives in shared values rather than closure
 * variables. Each worklet gets its own copy of a captured `let`, so a write in
 * `onStart` would never be seen by `onChange`.
 */
export function useSheetPan(
	state: SheetSharedState,
	geometry: SheetGeometry,
	animateTo: AnimateTo,
	options: SheetPanOptions
): SheetPans {
	const startBase = useSharedValue(0);
	const lastDetent = useSharedValue(-1);
	const overDragging = useSharedValue(false);
	const { enableHandlePanningGesture, enableContentPanningGesture, onDetentHaptic, onCloseHaptic, onOverDragHaptic } =
		options;

	return useMemo(() => {
		const begin = (source: GestureSource): void => {
			"worklet";
			cancelAnimation(state.base);
			state.animStatus.value = ANIM_STATUS.IDLE;
			state.gestureSource.value = source;
			startBase.value = state.base.value;
			lastDetent.value = detentUnder(state.base.value, geometry.detents.value);
			overDragging.value = false;
		};

		const haptics = (raw: number, next: number, lowest: number, highest: number, detents: readonly number[]): void => {
			"worklet";
			const over = raw > highest || raw < lowest;
			if (over && !overDragging.value && onOverDragHaptic) onOverDragHaptic();
			overDragging.value = over;

			if (crossedDetent(lastDetent.value, next, detents)) {
				lastDetent.value = detentUnder(next, detents);
				if (onDetentHaptic) onDetentHaptic();
			}
		};

		const move = (event: PanEvent): void => {
			"worklet";
			if (state.gestureSource.value === GESTURE_SOURCE.NONE) return;
			const config = state.config.value;
			const detents = geometry.detents.value;
			const closed = geometry.closedHeight.value;
			const scroll = state.gestureSource.value === GESTURE_SOURCE.CONTENT ? state.scrollOffsetY.value : 0;
			const raw = startBase.value - event.translationY - scroll;

			const lowest = config.enablePanDownToClose || detents.length === 0 ? closed : (detents[0] as number);
			const highest = geometry.highest.value;
			const factor = config.enableOverDrag ? config.overDragResistanceFactor : 0;
			const next = Math.min(resistOverDrag(raw, lowest, highest, factor), geometry.maxHeight.value);

			haptics(raw, next, lowest, highest, detents);
			state.base.value = next;
		};

		const release = (event: PanEvent): void => {
			"worklet";
			if (state.gestureSource.value === GESTURE_SOURCE.NONE) return;
			state.gestureSource.value = GESTURE_SOURCE.NONE;
			const config = state.config.value;
			const closed = geometry.closedHeight.value;
			const velocity = -event.velocityY;

			const target = selectSnapHeight({
				height: state.base.value,
				velocity,
				detents: geometry.detents.value,
				closedHeight: config.enablePanDownToClose ? closed : null,
				projection: SNAP_PROJECTION,
			});

			if (target <= closed && onCloseHaptic) onCloseHaptic();
			animateTo(target, "gesture", velocity / 2);
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
		startBase,
		lastDetent,
		overDragging,
		enableHandlePanningGesture,
		enableContentPanningGesture,
		onDetentHaptic,
		onCloseHaptic,
		onOverDragHaptic,
	]);
}
