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
import { SKELETON_CYCLE_MS } from "./skeleton.variants";

/**
 * A 0 → 1 clock that loops on the UI thread while `isRunning`.
 *
 * Both animations read the same clock — a shimmer as the band's position, a
 * pulse as a point on a cosine — which is what lets a `Skeleton.Group` hold one
 * for every placeholder inside it, whatever each of them draws.
 *
 * The timing sets `ReduceMotion.Never` deliberately. Under the default
 * `System` policy `withTiming` completes instantly while the OS setting is on,
 * so `withRepeat(-1)` would spin a zero-length animation forever. Reduce-motion
 * is honoured one level up instead, where `resolveSkeletonAnimation` stills the
 * skeleton and this clock is never started.
 */
export function useSkeletonClock(isRunning: boolean): SharedValue<number> {
	const progress = useSharedValue(0);

	useEffect(() => {
		if (!isRunning) {
			cancelAnimation(progress);
			progress.value = 0;
			return;
		}

		progress.value = 0;
		progress.value = withRepeat(
			withTiming(1, { duration: SKELETON_CYCLE_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
			-1,
			false
		);

		// Without this the repeat outlives the unmount when the content lands.
		return () => cancelAnimation(progress);
	}, [isRunning, progress]);

	return progress;
}
