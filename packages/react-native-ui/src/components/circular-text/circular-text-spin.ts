import { useEffect } from "react";
import {
	type SharedValue,
	useAnimatedReaction,
	useFrameCallback,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { CircularTextSpin } from "./circular-text.types";
import {
	advanceRotation,
	CIRCULAR_TEXT_DEFAULT_SPEED,
	CIRCULAR_TEXT_EASE_MS,
	type CircularTextDirection,
	resolveSpinVelocity,
} from "./circular-text.variants";

/**
 * The ring's angle, in degrees, as a shared value the wrapper's transform reads.
 *
 * A frame-callback integrator rather than `withRepeat`: a repeat cannot pause or change speed
 * without restarting from an angle of its own, which is a visible snap. Here velocity is the only
 * thing that moves on a pause or a speed change — eased with `withTiming` — and the angle
 * integrates from wherever it is.
 *
 * The callback is active only while the ring is looping. Static, controlled and calm rings
 * register nothing on the frame loop; under calm motion the angle returns to 0, so a ring that
 * stills reads upright from 12 o'clock.
 *
 * `isPressed` is the press-to-pause gesture's state, written on the UI thread; `isPaused` is the
 * app's. Either eases the velocity to zero.
 */
export function useCircularSpin({
	direction,
	isCalm,
	isPaused,
	isPressed,
	spin,
}: {
	direction: CircularTextDirection;
	isCalm: boolean;
	isPaused: boolean;
	isPressed: SharedValue<boolean>;
	spin: CircularTextSpin;
}): SharedValue<number> {
	const rotation = useSharedValue(0);
	const isLooping = spin.kind === "loop" && !isCalm;
	const target = resolveSpinVelocity(direction, spin.kind === "loop" ? (spin.speed ?? CIRCULAR_TEXT_DEFAULT_SPEED) : 0);
	const velocity = useSharedValue(isPaused ? 0 : target);

	const frame = useFrameCallback((info) => {
		rotation.value = advanceRotation(rotation.value, info.timeSincePreviousFrame ?? 0, velocity.value);
	}, false);

	useEffect(() => {
		frame.setActive(isLooping);
		if (!isLooping) rotation.value = 0;
	}, [frame, isLooping, rotation]);

	useAnimatedReaction(
		() => isPaused || isPressed.value,
		(paused) => {
			velocity.value = withTiming(paused ? 0 : target, { duration: CIRCULAR_TEXT_EASE_MS });
		}
	);

	return rotation;
}
