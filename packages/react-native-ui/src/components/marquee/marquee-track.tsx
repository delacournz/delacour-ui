import { type ReactElement, useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	ReduceMotion,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useFrameCallback,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { MarqueeStripProps } from "./marquee.types";
import {
	advanceMarqueeOffset,
	clampFrameDelta,
	type MarqueeDirection,
	type MarqueePause,
	resolveMarqueeCopies,
	resolveMarqueeHeld,
	resolveMarqueeTranslation,
	resolveMarqueeVelocity,
} from "./marquee.variants";

export type MarqueeTrackProps = MarqueeStripProps & {
	direction: MarqueeDirection;
	speed: number;
	pause: MarqueePause;
	easeMs: number;
	/** The container's length on the axis, from the root's `onLayout`. 0 until measured. */
	container: number;
	/** The finger-down flag — the group's when there is one, so a press on any row holds them all. */
	isPressed: SharedValue<boolean>;
	trackClassName: string;
};

/**
 * The moving strip: copies of the content laid end to end, translated on the
 * UI thread by a frame-callback integrator.
 *
 * Each frame adds `dt × velocity` to an offset and wraps it by the period — the
 * measured length of one copy, trailing gap included. Pausing eases `velocity`
 * to zero rather than stopping a timeline, so a hold, a resume and a change of
 * speed all continue from wherever the strip is, with no jump. Nothing here
 * re-renders per frame; the copy count is the only state, and it changes on
 * layout.
 *
 * The first frame shows one copy at opacity 0. Once the copy reports its length
 * the rest mount, and only after that commit is the period handed to the UI
 * thread — so the strip never shows a translation its copies do not yet cover.
 */
export function MarqueeTrack({
	children,
	axis,
	direction,
	speed,
	pause,
	easeMs,
	container,
	isPressed,
	copyClassName,
	trackClassName,
	isContentHidden,
}: MarqueeTrackProps): ReactElement {
	const [period, setPeriod] = useState(0);
	const committedPeriod = useSharedValue(0);
	const offset = useSharedValue(0);
	const velocity = useSharedValue(0);

	const copies = resolveMarqueeCopies(container, period);
	const target = resolveMarqueeVelocity(direction, speed);
	const isHorizontal = axis === "horizontal";

	useEffect(() => {
		committedPeriod.value = period;
	}, [committedPeriod, period]);

	// The target velocity is decided on the UI thread, where the finger-down
	// flag lives, and eased into rather than set: a held strip decelerates and a
	// released one picks back up, and a speed change mid-flight glides.
	useAnimatedReaction(
		() => (resolveMarqueeHeld(pause, isPressed.value) ? 0 : target),
		(next, previous) => {
			if (next === previous) return;
			velocity.value =
				easeMs > 0
					? withTiming(next, { duration: easeMs, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never })
					: next;
		}
	);

	useFrameCallback((frame) => {
		offset.value = advanceMarqueeOffset(
			offset.value,
			clampFrameDelta(frame.timeSincePreviousFrame ?? 0),
			velocity.value,
			committedPeriod.value
		);
	});

	const motionStyle = useAnimatedStyle(() => {
		const translation = resolveMarqueeTranslation(offset.value, committedPeriod.value, direction);
		return {
			opacity: committedPeriod.value > 0 ? 1 : 0,
			transform: isHorizontal ? [{ translateX: translation }] : [{ translateY: translation }],
		};
	});

	// A gesture that never activates: it only watches a finger arrive and leave.
	// One that activated — a long press with no minimum duration — would cancel
	// a child `Pressable`'s tap the moment the finger landed, and nothing at this
	// level can name a child's gesture to run alongside it.
	const isPressPause = pause.kind === "press";
	const gesture = useMemo(
		() =>
			Gesture.Manual()
				.enabled(isPressPause)
				.onTouchesDown(() => {
					"worklet";
					isPressed.value = true;
				})
				.onTouchesUp((_event, manager) => {
					"worklet";
					manager.fail();
				})
				.onTouchesCancelled((_event, manager) => {
					"worklet";
					manager.fail();
				})
				.onFinalize(() => {
					"worklet";
					isPressed.value = false;
				}),
		[isPressPause, isPressed]
	);

	const onCopyLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setPeriod(isHorizontal ? width : height);
	};

	// Copy 1 is the content and stays reachable by a screen reader even while it
	// slides; every other copy is a duplicate and is hidden on both platforms.
	return (
		<GestureDetector gesture={gesture}>
			<Animated.View className={trackClassName} style={motionStyle}>
				{Array.from({ length: copies }, (_, index) => {
					const isHidden = isContentHidden || index > 0;
					return (
						<View
							accessibilityElementsHidden={isHidden}
							className={copyClassName}
							importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
							key={index}
							onLayout={index === 0 ? onCopyLayout : undefined}
						>
							{children}
						</View>
					);
				})}
			</Animated.View>
		</GestureDetector>
	);
}
MarqueeTrack.displayName = "DelacourUI.Marquee.Track";
