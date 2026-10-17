import { useEffect } from "react";
import {
	cancelAnimation,
	Easing,
	ReduceMotion,
	type SharedValue,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { MARKER_SHIMMER_CYCLE_MS, MARKER_SHIMMER_SETTLE_MS } from "./marker.variants";

export type MarkerShimmerClock = {
	/** 0 → 1 around one cycle, looping while running. */
	progress: SharedValue<number>;
	/** How much of the sweep is applied: 1 while running, easing to 0 once stopped. */
	blend: SharedValue<number>;
};

/**
 * The running shimmer's clock, on the UI thread.
 *
 * The loop sets `ReduceMotion.Never` deliberately — under the default `System`
 * policy `withTiming` completes instantly while the OS setting is on, so
 * `withRepeat(-1)` would spin a zero-length animation forever. Calm motion is
 * honoured one level up, in `resolveMarkerShimmer`, and this clock is never
 * started. The same arrangement as `Skeleton`'s clock, kept local so the two
 * folders stay uncoupled.
 *
 * Stopping cancels the loop where it stands and eases `blend` to 0 over
 * `MARKER_SHIMMER_SETTLE_MS`, so the text returns to opaque rather than snapping.
 * Starting resets the loop to 0, where the sweep is already opaque, so it
 * never jumps either.
 */
export function useMarkerShimmerClock(isRunning: boolean): MarkerShimmerClock {
	const progress = useSharedValue(0);
	const blend = useSharedValue(isRunning ? 1 : 0);

	useEffect(() => {
		if (!isRunning) {
			cancelAnimation(progress);
			blend.value = withTiming(0, { duration: MARKER_SHIMMER_SETTLE_MS, easing: Easing.out(Easing.quad) });
			return;
		}

		cancelAnimation(blend);
		blend.value = 1;
		progress.value = 0;
		progress.value = withRepeat(
			withTiming(1, { duration: MARKER_SHIMMER_CYCLE_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
			-1,
			false
		);

		// Without this the repeat outlives the unmount.
		return () => cancelAnimation(progress);
	}, [isRunning, progress, blend]);

	return { progress, blend };
}
