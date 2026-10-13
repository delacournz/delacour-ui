import { useCallback, useEffect, useRef } from "react";
import { NUMBER_INPUT_REPEAT_DELAY_MS, resolveRepeatInterval } from "./number-input.format";

/** What a tick tells the repeat to do next. */
export type StepRepeatTick = "continue" | "stop";

export type StepRepeat = {
	/** Fires tick 0 at once, then repeats after the delay on the accelerating schedule. */
	start: () => void;
	/** Cancels any pending tick. Safe to call when nothing is running. */
	stop: () => void;
};

/**
 * Hold-to-repeat timing for a stepper.
 *
 * `start` runs tick 0 synchronously — the press itself is a step — then waits
 * {@link NUMBER_INPUT_REPEAT_DELAY_MS} and repeats on `resolveRepeatInterval`'s
 * schedule until `stop`, until a tick answers `"stop"`, or until unmount. The
 * schedule is pure and lives in `number-input.format.ts`; this hook owns only
 * the timer, so the one thing `bun test` cannot reach is a `setTimeout`.
 *
 * `onTick` is read through a ref, so a tick always sees the latest render's
 * value and bounds rather than the ones captured when the press began.
 */
export function useStepRepeat(onTick: (tick: number) => StepRepeatTick): StepRepeat {
	const onTickRef = useRef(onTick);
	useEffect(() => {
		onTickRef.current = onTick;
	});
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stop = useCallback(() => {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
	}, []);

	const start = useCallback(() => {
		stop();
		if (onTickRef.current(0) === "stop") return;

		const schedule = (tick: number, delay: number) => {
			timer.current = setTimeout(() => {
				timer.current = null;
				if (onTickRef.current(tick) === "stop") return;
				schedule(tick + 1, resolveRepeatInterval(tick));
			}, delay);
		};
		schedule(1, NUMBER_INPUT_REPEAT_DELAY_MS);
	}, [stop]);

	useEffect(() => stop, [stop]);

	return { start, stop };
}
