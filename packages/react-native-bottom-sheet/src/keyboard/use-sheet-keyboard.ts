import { type RefObject, useEffect, useMemo, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { useKeyboardContext, useReanimatedFocusedInput } from "react-native-keyboard-controller";
import { type SharedValue, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import type { AnimateTo } from "../animation/animation.types";
import {
	CLOSED_INDEX,
	GESTURE_SOURCE,
	heightForIndex,
	indexForHeight,
	isInputInsideSheet,
	keyboardInContainer,
	keyboardStep,
	resolveKeyboardOwner,
} from "../core";
import { ANIM_STATUS, type SheetGeometry, type SheetSharedState } from "../state/state.types";
import { reconcileKeyboardAnimation } from "./use-keyboard-animation-guard";

/**
 * What `useBottomSheetTextInput` writes into: the native nodes of every
 * registered field, and whether one of them holds focus.
 */
export type SheetKeyboardRegistry = {
	nodes: RefObject<Set<number>>;
	focused: SharedValue<boolean>;
};

export type UseSheetKeyboardOptions = {
	state: SheetSharedState;
	geometry: SheetGeometry;
	animateTo: AnimateTo;
	/** Whether the portal's children are mounted; the stale-keyboard guard runs on each presentation. */
	presented: boolean;
};

/**
 * The keyboard, from keyboard-controller's shared values into the sheet's.
 *
 * Two reactions. The first is the writer: every frame the keyboard's `height`
 * (negative, from the window's bottom edge) or `progress` moves, or the
 * focused input's frame changes, it writes `keyboardHeight` (positive, within
 * the container), `keyboardProgress` and `keyboardOwned`. Ownership goes
 * through `resolveKeyboardOwner` — a registered field, or under `inside` a
 * focused input whose frame overlaps the sheet, and sticky through a
 * transition once claimed. Everything the geometry derives from those three
 * — the lift, the body's area, the footer's place — follows on the UI thread
 * with no further code here.
 *
 * The second is the behaviour. `interactive` and `none` need none: one lifts
 * by derivation, the other ignores the keyboard. `extend` and `fillParent`
 * snap — to the highest detent or the container — when an owned keyboard
 * rises, and `keyboardBlurBehavior: "restore"` sends the sheet back to the
 * detent it held when the keyboard leaves. `keyboardStep` in the core makes
 * that call from two consecutive samples; this reaction only carries it out,
 * and stays out of the way of a gesture that owns `base`.
 */
export function useSheetKeyboard({
	state,
	geometry,
	animateTo,
	presented,
}: UseSheetKeyboardOptions): SheetKeyboardRegistry {
	const { reanimated } = useKeyboardContext();
	const { height, progress } = reanimated;
	const { input } = useReanimatedFocusedInput();
	const { height: windowHeight } = useWindowDimensions();
	const nodes = useRef(new Set<number>());
	const focused = useSharedValue(false);
	const indexBefore = useSharedValue(CLOSED_INDEX);
	const applied = useSharedValue(false);

	useEffect(() => {
		if (presented) reconcileKeyboardAnimation(reanimated);
	}, [presented, reanimated]);

	useAnimatedReaction(
		() => ({
			raw: height.value,
			progress: progress.value,
			layout: input.value,
			registered: focused.value,
			offset: state.containerBottomOffset.value,
			container: state.containerHeight.value,
			position: geometry.position.value,
		}),
		(current) => {
			const keyboardHeight = keyboardInContainer(current.raw, current.offset);
			const containerBottom = windowHeight - current.offset;
			const layout = current.layout;
			const inside =
				layout !== null &&
				current.container > 0 &&
				isInputInsideSheet({
					inputY: layout.layout.absoluteY,
					inputHeight: layout.layout.height,
					sheetTop: containerBottom - current.container + current.position,
					containerBottom,
				});
			const owned = resolveKeyboardOwner({
				scope: state.config.value.keyboardScope,
				registeredFocused: current.registered,
				inputInside: inside,
				inputFocused: layout !== null,
				progress: current.progress,
				previousOwned: state.keyboardOwned.value,
			});
			if (state.keyboardHeight.value !== keyboardHeight) state.keyboardHeight.value = keyboardHeight;
			if (state.keyboardProgress.value !== current.progress) state.keyboardProgress.value = current.progress;
			if (state.keyboardOwned.value !== owned) state.keyboardOwned.value = owned;
		},
		[state, geometry, height, progress, input, focused, windowHeight]
	);

	useAnimatedReaction(
		() => ({ progress: progress.value, owned: state.keyboardOwned.value }),
		(current, previous) => {
			if (previous === null) return;
			const config = state.config.value;
			const closed = geometry.closedHeight.value;
			const running = state.animStatus.value === ANIM_STATUS.RUNNING;
			const sheetOpen = running ? state.animTarget.value > closed : state.base.value > closed;

			const step = keyboardStep({
				behavior: config.keyboardBehavior,
				blurBehavior: config.keyboardBlurBehavior,
				progress: current.progress,
				previousProgress: previous.progress,
				owned: current.owned,
				previousOwned: previous.owned,
				applied: applied.value,
				sheetOpen,
			});
			if (step === null) return;

			// A finger on the sheet owns `base`; the release will settle it.
			const dragging = state.gestureSource.value !== GESTURE_SOURCE.NONE;

			if (step === "apply") {
				if (dragging) return;
				applied.value = true;
				indexBefore.value = running
					? Math.round(indexForHeight(state.animTarget.value, geometry.detents.value, closed))
					: state.currentIndex.value;
				const target = config.keyboardBehavior === "fillParent" ? geometry.maxHeight.value : geometry.highest.value;
				if (running || Math.abs(target - state.base.value) > 0.5) animateTo(target, "keyboard", 0);
				return;
			}

			applied.value = false;
			const index = indexBefore.value;
			indexBefore.value = CLOSED_INDEX;
			if (step !== "restore" || dragging || !sheetOpen || index < 0) return;

			const detents = geometry.detents.value;
			if (detents.length === 0) return;
			const target = heightForIndex(Math.min(index, detents.length - 1), detents, closed);
			if (Math.abs(target - state.base.value) > 0.5) animateTo(target, "keyboard", 0);
		},
		[state, geometry, animateTo, progress, applied, indexBefore]
	);

	return useMemo<SheetKeyboardRegistry>(() => ({ nodes, focused }), [focused]);
}
