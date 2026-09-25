import { useMemo } from "react";
import { Platform } from "react-native";
import { cancelAnimation, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { type AnimationSource, indexForHeight, type ReduceMotionMode, selectAnimation } from "../core";
import { ANIM_STATUS, type SheetGeometry, type SheetSharedState } from "../state/state.types";
import type { AnimateListener, AnimateTo, JumpTo, SettleAt, SettleListener, SheetAnimation } from "./animation.types";
import { toReanimated } from "./resolve-animation";

export type UseAnimateToOptions = {
	state: SheetSharedState;
	geometry: SheetGeometry;
	animation: SheetAnimation | undefined;
	overrideReduceMotion: ReduceMotionMode | undefined;
	/** Stable across renders — the root wraps its props in refs. */
	onSettle: SettleListener;
	onAnimate: AnimateListener;
};

/**
 * The one way `base` moves.
 *
 * `animateTo` cancels whatever is in flight, records the target and source,
 * tells the JS thread an animation started, and hands `base` to a spring or a
 * timing whose completion writes `currentIndex` and reports the settle.
 * `jumpTo` is the same without the motion — `forceClose`, a container resize,
 * and `animateOnMount: false`. `settleAt` is the completion alone: no
 * `onAnimate`, no target recorded, `base` written to the detent it is already
 * within a settle tolerance of. It is for the content pan whose release the
 * list owns — the finger carried the sheet to the top and kept scrolling, so
 * nothing animated and nothing would otherwise write `currentIndex`.
 *
 * Both are hook-scope worklets: they close over `indexForHeight` from the core
 * in the ordinary way, which is what the flat-worklet rule permits and what a
 * module-scope worklet could not do.
 *
 * A cancelled animation does not settle. The gesture that cancelled it will,
 * and an animation that interrupted it has its own completion; settling on
 * `finished === false` would report an index the sheet never reached.
 */
export function useAnimateTo(options: UseAnimateToOptions): {
	animateTo: AnimateTo;
	jumpTo: JumpTo;
	settleAt: SettleAt;
} {
	const { state, geometry, animation, overrideReduceMotion, onSettle, onAnimate } = options;
	const platform = Platform.OS;
	const animationKey = JSON.stringify(animation ?? null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `animation` is keyed by its serialisation
	const resolved = useMemo(
		() => toReanimated(selectAnimation(animation, platform, overrideReduceMotion)),
		[animationKey, platform, overrideReduceMotion]
	);

	return useMemo(() => {
		const settle = (target: number, source: AnimationSource): void => {
			"worklet";
			state.animStatus.value = ANIM_STATUS.IDLE;
			const index = Math.round(indexForHeight(target, geometry.detents.value, geometry.closedHeight.value));
			state.currentIndex.value = index;
			scheduleOnRN(onSettle, index, target, source, geometry.detents.value.length);
		};

		const begin = (target: number, source: AnimationSource): void => {
			"worklet";
			cancelAnimation(state.base);
			const fromHeight = state.base.value;
			const fromIndex = geometry.index.value;
			const toIndex = indexForHeight(target, geometry.detents.value, geometry.closedHeight.value);
			state.animStatus.value = ANIM_STATUS.RUNNING;
			state.animSource.value = source;
			state.animTarget.value = target;
			scheduleOnRN(onAnimate, fromIndex, toIndex, fromHeight, target, source);
		};

		const animateTo: AnimateTo = (target, source, velocity) => {
			"worklet";
			begin(target, source);
			const complete = (finished?: boolean): void => {
				"worklet";
				if (finished === true) settle(target, source);
			};
			if (resolved.type === "spring") {
				state.base.value = withSpring(target, { ...resolved.config, velocity }, complete);
				return;
			}
			state.base.value = withTiming(target, resolved.config, complete);
		};

		const jumpTo: JumpTo = (target, source) => {
			"worklet";
			begin(target, source);
			state.base.value = target;
			settle(target, source);
		};

		const settleAt: SettleAt = (target, source) => {
			"worklet";
			cancelAnimation(state.base);
			state.base.value = target;
			settle(target, source);
		};

		return { animateTo, jumpTo, settleAt };
	}, [state, geometry, resolved, onSettle, onAnimate]);
}
