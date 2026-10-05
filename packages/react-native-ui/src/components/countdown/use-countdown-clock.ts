import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { msUntilNextTick, secondsUntil, toEpochMs } from "./countdown.variants";

export type CountdownClockOptions = {
	to: Date | number;
	/** The wall clock, in epoch milliseconds. Injectable for tests and demos. */
	now?: () => number;
	onTick?: (secondsLeft: number) => void;
	onComplete?: () => void;
};

type ClockState = { to: number; seconds: number };

/**
 * Whole seconds left until `to`, re-read from the wall clock on every tick.
 *
 * One `setTimeout` at a time, aimed at the next whole-second boundary of `to - now` and re-aimed
 * after it fires, so the count never drifts the way a `setInterval` does. It also re-reads the
 * moment the app returns to the foreground — timers do not run in the background, and without
 * that a countdown left for thirty seconds would resume showing the time it was left at.
 *
 * `onComplete` fires once per `to`: a new `to` in the future arms it again.
 */
export function useCountdownClock({ to, now, onTick, onComplete }: CountdownClockOptions): number {
	const target = toEpochMs(to);
	const [state, setState] = useState<ClockState>(() => ({
		seconds: secondsUntil(target, (now ?? Date.now)()),
		to: target,
	}));

	// A new target resets the count in the same render, so nothing below ever pairs the new
	// target with the old count — that pairing would fire `onComplete` for a `to` still ahead.
	let seconds = state.seconds;
	if (state.to !== target) {
		seconds = secondsUntil(target, (now ?? Date.now)());
		setState({ seconds, to: target });
	}

	const callbacks = useRef({ now, onComplete, onTick });
	useEffect(() => {
		callbacks.current = { now, onComplete, onTick };
	});

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const clock = (): number => (callbacks.current.now ?? Date.now)();

		const sync = (): void => {
			if (timer !== undefined) clearTimeout(timer);
			timer = undefined;
			const at = clock();
			setState({ seconds: secondsUntil(target, at), to: target });
			const delay = msUntilNextTick(target, at);
			if (delay !== null) timer = setTimeout(sync, delay);
		};

		sync();
		const subscription = AppState.addEventListener("change", (status) => {
			if (status === "active") sync();
		});
		return () => {
			if (timer !== undefined) clearTimeout(timer);
			subscription.remove();
		};
	}, [target]);

	useEffect(() => {
		callbacks.current.onTick?.(seconds);
	}, [seconds]);

	const completedFor = useRef<number | null>(null);
	useEffect(() => {
		if (seconds > 0 || completedFor.current === target) return;
		completedFor.current = target;
		callbacks.current.onComplete?.();
	}, [seconds, target]);

	return seconds;
}
