import { useEffect, useRef } from "react";
import { type SharedValue, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type TextAnimationClockOptions = {
	/** Whether the clock advances. Paused, it holds where it is. */
	isRunning: boolean;
	/** Any change rewinds the clock to 0 and starts a new run. */
	runKey: string;
	/** The clock stops itself here and reports it. `Infinity` for a loop. */
	limitMs: number;
	/** Called once per run, on the JS thread, when the clock reaches `limitMs`. */
	onLimit?: () => void;
};

/**
 * An elapsed-ms shared value that advances by each frame's `dt` while running.
 *
 * Every part is a pure function of this one number — a unit's progress, the
 * typed count, the caret's blink — so the whole animation can be paused,
 * seeked or replayed without starting a `withTiming` per unit, and a clip
 * replays frame for frame.
 *
 * A run is identified by `runKey`. Changing it rewinds to 0, and a limit
 * crossed by an older run is dropped rather than reported, so an interrupted
 * animation never fires its predecessor's callback.
 */
export function useTextAnimationClock({
	isRunning,
	runKey,
	limitMs,
	onLimit,
}: TextAnimationClockOptions): SharedValue<number> {
	const elapsed = useSharedValue(0);
	const run = useSharedValue(0);
	const reported = useSharedValue(false);
	const runRef = useRef(0);
	const onLimitRef = useRef(onLimit);

	useEffect(() => {
		onLimitRef.current = onLimit;
	}, [onLimit]);

	const handleLimit = (finishedRun: number) => {
		if (finishedRun !== runRef.current) return;
		onLimitRef.current?.();
	};

	const frame = useFrameCallback((info) => {
		if (reported.value) return;
		const next = elapsed.value + (info.timeSincePreviousFrame ?? 0);
		if (next >= limitMs) {
			elapsed.value = limitMs;
			reported.value = true;
			scheduleOnRN(handleLimit, run.value);
			return;
		}
		elapsed.value = next;
	}, false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: runKey is the trigger, not a value read here
	useEffect(() => {
		runRef.current += 1;
		run.value = runRef.current;
		elapsed.value = 0;
		reported.value = false;
	}, [runKey, elapsed, reported, run]);

	useEffect(() => {
		frame.setActive(isRunning);
		return () => frame.setActive(false);
	}, [frame, isRunning]);

	return elapsed;
}
