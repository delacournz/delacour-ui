import { type ReactElement, useCallback, useMemo } from "react";
import type { LayoutChangeEvent, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { playHaptic } from "@registry/ui/pressable";
import { useSliderPart } from "./slider.context";
import type { SliderRenderChildren } from "./slider.types";
import {
	clampThumb,
	nearestThumbIndex,
	shouldTickHaptic,
	sliderVariants,
	snapToStep,
	valueFromOffset,
} from "./slider.variants";

export type SliderTrackProps = Omit<ViewProps, "children" | "style"> & {
	/**
	 * The fill and the thumbs. A function is called with the slider's settled
	 * state, which is how a range maps over its own values.
	 */
	children?: SliderRenderChildren;
	className?: string;
};

/**
 * The groove the thumbs run along, and the surface the drag is claimed on.
 *
 * This is where the whole gesture lives. One `Gesture.Pan()` drives every thumb:
 * touching down grabs the nearest one and moves it to the finger, and from there
 * the drag tracks it. One rule rather than a tap mode and a drag mode — the
 * alternative, dragging the handle only, is what iOS's own slider does and it is
 * a poor trade on a wide track, where the thumb is usually nowhere near where you
 * are pointing.
 *
 * **The value is written in `onBegin`, not only in `onUpdate`.** A pan activates
 * on the first *movement*, so a stationary tap never reaches `onStart` or
 * `onUpdate` at all — a slider that only computed there would tick, lift its
 * thumb and then not move it. `onFinalize` is likewise where the drag is reported
 * as finished, because it is the one callback that fires on every path, including
 * the one where the pan never activated.
 *
 * **`minDistance(0)` is what wins the touch from a scroll view.**
 * `Screen.ScrollArea` renders React Native's own `ScrollView`, not Gesture
 * Handler's, so there is no handler to negotiate with — the two race, and a pan
 * that activates on the first move beats a scroll view's ten-point slop on both
 * platforms. It is also why there is no `activeOffsetX` here: waiting for the
 * axis to declare itself would hand the scroll the first move and put a dead zone
 * at the start of every drag. `blocksExternalGesture` is not the answer either —
 * it resolves a ref to a handler tag, a plain `ScrollView` has none, and the call
 * is dropped without an error.
 *
 * **`shouldCancelWhenOutside(false)`** where `Pressable`'s tap sets it `true`:
 * dragging a thumb to the far end routinely leaves the track's bounds, and the
 * value must keep tracking rather than the gesture giving up.
 *
 * The mirror back to React is deliberately thin. `positions` is written on the UI
 * thread at the display's refresh rate; only a *changed* set of snapped values is
 * scheduled across, so a whole-track drag at the default step is a few dozen
 * commits rather than one per frame.
 */
export function SliderTrack({ children, className, ...props }: SliderTrackProps): ReactElement {
	const {
		positions,
		trackSize,
		thumbSize,
		activeIndex,
		minValue,
		maxValue,
		step,
		haptic,
		orientation,
		color,
		size,
		isInvalid,
		isDisabled,
		commitValues,
		commitEnd,
		setDragging,
		renderProps,
	} = useSliderPart("Slider.Track");
	const isVertical = orientation === "vertical";

	// What the last haptic reported, and where the finger was when it did. Both
	// feed `shouldTickHaptic`, which is what keeps a flick across a fine step scale
	// from firing a hundred times.
	const lastTick = useSharedValue(Number.NaN);
	const lastTickPosition = useSharedValue(0);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			trackSize.value = isVertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width;
		},
		[isVertical, trackSize]
	);

	const gesture = useMemo(() => {
		// Declared here rather than at module scope, and called only from the two
		// callbacks below. A worklet defined beside its callers in one scope is
		// captured by ordinary closure; a module-scope one binds at import time, in
		// source order, which is how a helper ends up `undefined` on the UI thread.
		const applyTouch = (along: number, forIndex: number, isGrab: boolean) => {
			"worklet";
			const thumb = thumbSize.value;
			const travel = trackSize.value - thumb;
			// The touch is read in the thumb's own frame — its centre, not its left
			// edge — so the handle stays inside the groove at both ends.
			const position = along - thumb / 2;
			const raw = valueFromOffset({ position, travel, minValue, maxValue, isVertical });
			const snapped = snapToStep(raw, step, minValue, maxValue);
			const current = positions.value;
			const next = clampThumb(snapped, current, forIndex, minValue, maxValue);

			if (next !== current[forIndex]) {
				const updated = [...current];
				updated[forIndex] = next;
				positions.value = updated;
			}

			// The grab itself always confirms, the way a press does. After that the
			// ticks are the step crossings, rate-limited by distance travelled.
			if (isGrab) {
				lastTick.value = next;
				lastTickPosition.value = position;
				if (haptic !== false) playHaptic(haptic);
				return;
			}

			if (
				haptic !== false &&
				shouldTickHaptic({
					lastPosition: lastTickPosition.value,
					lastSnapped: lastTick.value,
					maxValue,
					minValue,
					position,
					snapped: next,
					step,
				})
			) {
				playHaptic(haptic);
				lastTick.value = next;
				lastTickPosition.value = position;
			}
		};

		return Gesture.Pan()
			.enabled(!isDisabled)
			.minDistance(0)
			.shouldCancelWhenOutside(false)
			.onBegin((event) => {
				"worklet";
				const along = isVertical ? event.y : event.x;
				const thumb = thumbSize.value;
				const raw = valueFromOffset({
					isVertical,
					maxValue,
					minValue,
					position: along - thumb / 2,
					travel: trackSize.value - thumb,
				});
				const index = nearestThumbIndex(positions.value, raw);
				activeIndex.value = index;
				scheduleOnRN(setDragging, true);
				applyTouch(along, index, true);
			})
			.onUpdate((event) => {
				"worklet";
				const index = activeIndex.value;
				if (index < 0) return;
				applyTouch(isVertical ? event.y : event.x, index, false);
			})
			.onFinalize(() => {
				"worklet";
				activeIndex.value = -1;
				// Order matters: the root must have stopped treating this as a live
				// drag before `commitEnd` asks it to re-sync. `scheduleOnRN` keeps
				// them in the order they were queued.
				scheduleOnRN(setDragging, false);
				scheduleOnRN(commitEnd, [...positions.value]);
			});
	}, [
		activeIndex,
		commitEnd,
		haptic,
		isDisabled,
		isVertical,
		lastTick,
		lastTickPosition,
		maxValue,
		minValue,
		positions,
		setDragging,
		step,
		thumbSize,
		trackSize,
	]);

	// The one hop from the UI thread back to React, and it is gated element-wise:
	// `useAnimatedReaction` re-runs on every write, and `positions` is a fresh
	// array each time, so identity says nothing about whether the value moved.
	useAnimatedReaction(
		() => positions.value,
		(current, previous) => {
			if (previous !== null && current.length === previous.length) {
				let changed = false;
				for (let index = 0; index < current.length; index++) {
					if (current[index] !== previous[index]) {
						changed = true;
						break;
					}
				}
				if (!changed) return;
			}
			scheduleOnRN(commitValues, [...current]);
		},
		[commitValues]
	);

	const slots = sliderVariants({ color, isDisabled, isInvalid, orientation, size });

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View className={slots.touchArea()} {...props}>
				<Animated.View className={slots.track({ className })} onLayout={handleLayout}>
					{typeof children === "function" ? children(renderProps) : children}
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
}
SliderTrack.displayName = "DelacourUI.Slider.Track";
