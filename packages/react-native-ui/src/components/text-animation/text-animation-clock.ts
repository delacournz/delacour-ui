import { useEffect, useRef, useState } from "react";
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

export type TextAnimationClock = {
	/** Milliseconds into the current run. */
	elapsed: SharedValue<number>;
	/** The run `elapsed` has been rewound for. Lags `runId` until the rewind lands. */
	run: SharedValue<number>;
	/** The run this render belongs to, counted during render. */
	runId: number;
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
 *
 * The rewind runs in an effect, after the new render has committed, so a
 * part drawn for the new run compares `run` with `runId` and holds its start
 * until they match — new text never paints at the old run's end.
 */
export function useTextAnimationClock({
	isRunning,
	runKey,
	limitMs,
	onLimit,
}: TextAnimationClockOptions): TextAnimationClock {
	const elapsed = useSharedValue(0);
	const run = useSharedValue(0);
	const reported = useSharedValue(false);
	const runRef = useRef(0);
	// Counted during render, so the units of a new run know it before they paint.
	const [counted, setCounted] = useState({ runKey, id: 0 });
	const current = counted.runKey === runKey ? counted : { runKey, id: counted.id + 1 };
	if (current !== counted) setCounted(current);
	const runId = current.id;
	const onLimitRef = useRef(onLimit);

	useEffect(() => {
		onLimitRef.current = onLimit;
	}, [onLimit]);

	const handleLimit = (finishedRun: number) => {
		if (finishedRun !== runRef.current) return;
		// A finished run stops the frame callback; a new run starts it again.
		frame.setActive(false);
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

	// `run` is written last, so a frame between the writes still holds the start.
	useEffect(() => {
		runRef.current = runId;
		elapsed.value = 0;
		reported.value = false;
		run.value = runId;
	}, [runId, elapsed, reported, run]);

	// After the rewind above, so a new run is live again; a run that already
	// reached its limit stays off when `isRunning` flips back on.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runId is the trigger, not a value read here
	useEffect(() => {
		frame.setActive(isRunning && !reported.value);
		return () => frame.setActive(false);
	}, [frame, isRunning, reported, runId]);

	return { elapsed, run, runId };
}
