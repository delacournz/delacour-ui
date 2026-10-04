import { useCallback, useMemo, useRef } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import type { AnimateTo, JumpTo } from "../animation/animation.types";
import { GESTURE_SOURCE, heightForIndex, indexForHeight, resolveIntent, type SheetIntent } from "../core";
import { ANIM_STATUS, type SheetGeometry, type SheetSharedState } from "./state.types";

/** `Omit` over each member of a union, rather than over the union's common keys. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Every request the JS thread can make, minus the `id` the dispatcher stamps on it. */
export type IntentRequest = DistributiveOmit<SheetIntent, "id">;

export type SheetIntentDispatch = (request: IntentRequest) => void;

/**
 * The JS thread's handle on the queue.
 *
 * `lastKind` is the kind of the most recent request, tracked on the JS side.
 * A JS write to a shared value is queued to the UI thread, so reading
 * `state.intent.value` straight after a `dispatch` still returns what was
 * there before — the root once read `null` that way, queued an `open` on top
 * of a ref's `expand`, and the sheet landed on the wrong snap point. `clear`
 * writes `null` in order after whatever was queued, which is what a controlled
 * `isOpen: false` needs to cancel an open still waiting on layout.
 */
export type SheetIntents = {
	dispatch: SheetIntentDispatch;
	clear: () => void;
	lastKind: () => IntentRequest["kind"] | null;
};

/**
 * Intents replace present/dismiss.
 *
 * The JS thread never animates. It writes a request into `state.intent`, and a
 * reaction keyed on the request's `id` and on `layoutReady` runs
 * `resolveIntent` on the UI thread: a close while closed is nothing, an open
 * before the first layout stays queued until the measurements land, a
 * `forceClose` jumps. Two identical requests in a row both run, because each
 * carries a fresh `id`.
 *
 * The first open a sheet resolves is its mount: reported as `"mount"`, and a
 * jump rather than an animation when `animateOnMount` is off. `mountPending`
 * is the flag, and it clears on that first resolution whatever kind it was.
 *
 * A second reaction handles the snap points moving under a settled sheet — dynamic
 * content growing, a `snapPoints` change — by animating to the same index in
 * the new list, and a container resize by jumping there instead. Neither runs
 * while a gesture or an animation owns `base`.
 */
export function useSheetIntents(
	state: SheetSharedState,
	geometry: SheetGeometry,
	animateTo: AnimateTo,
	jumpTo: JumpTo
): SheetIntents {
	const nextId = useRef(0);
	const last = useRef<IntentRequest["kind"] | null>(null);

	const dispatch = useCallback<SheetIntentDispatch>(
		(request) => {
			nextId.current += 1;
			last.current = request.kind;
			state.intent.value = { ...request, id: nextId.current } as SheetIntent;
		},
		[state]
	);

	const clear = useCallback(() => {
		last.current = null;
		state.intent.value = null;
	}, [state]);

	const lastKind = useCallback(() => last.current, []);

	useAnimatedReaction(
		() => ({ id: state.intent.value?.id ?? 0, ready: geometry.layoutReady.value }),
		(current, previous) => {
			if (previous !== null && current.id === previous.id && current.ready === previous.ready) return;
			const intent = state.intent.value;
			if (intent === null) return;

			// Mid-animation the sheet is where it is going, not where it settled:
			// a close during the open animation has to see an open sheet.
			const effectiveIndex =
				state.animStatus.value === ANIM_STATUS.RUNNING
					? Math.round(indexForHeight(state.animTarget.value, geometry.snapPoints.value, geometry.closedHeight.value))
					: state.currentIndex.value;
			const resolution = resolveIntent(
				{
					currentIndex: effectiveIndex,
					base: state.base.value,
					layoutReady: current.ready,
					snapPoints: geometry.snapPoints.value,
					closedHeight: geometry.closedHeight.value,
					maxHeight: geometry.maxHeight.value,
					initialIndex: state.config.value.initialIndex,
				},
				intent
			);

			if (resolution === null) {
				state.intent.value = null;
				return;
			}
			if (resolution.action === "wait") return;
			state.intent.value = null;

			const mounting = state.mountPending.value && intent.kind === "open";
			state.mountPending.value = false;
			const source = mounting ? "mount" : "user";
			const jump = resolution.action === "jump" || (mounting && !state.config.value.animateOnMount);
			if (jump) jumpTo(resolution.target, source);
			else animateTo(resolution.target, source, 0);
		},
		[state, geometry, animateTo, jumpTo]
	);

	useAnimatedReaction(
		() => ({ snapPoints: geometry.snapPoints.value.join(","), container: state.containerHeight.value }),
		(current, previous) => {
			if (
				previous === null ||
				(current.snapPoints === previous.snapPoints && current.container === previous.container)
			) {
				return;
			}
			const busy = state.animStatus.value !== ANIM_STATUS.IDLE || state.gestureSource.value !== GESTURE_SOURCE.NONE;
			const index = state.currentIndex.value;
			if (busy || index < 0) return;

			const snapPoints = geometry.snapPoints.value;
			if (snapPoints.length === 0) return;
			const target = heightForIndex(Math.min(index, snapPoints.length - 1), snapPoints, geometry.closedHeight.value);
			if (Math.abs(target - state.base.value) < 0.5) return;

			if (current.container !== previous.container) {
				jumpTo(target, "container");
				return;
			}
			animateTo(target, "snapPoints", 0);
		},
		[state, geometry, animateTo, jumpTo]
	);

	return useMemo<SheetIntents>(() => ({ dispatch, clear, lastKind }), [dispatch, clear, lastKind]);
}
