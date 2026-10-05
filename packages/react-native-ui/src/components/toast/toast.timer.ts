/**
 * A toast's auto-hide clock, as plain data.
 *
 * `startedAt` is `null` while paused; `remaining` is what was left when it last
 * stopped. Every function returns a new value and reads the time it is given,
 * so pause and resume are exact and the whole clock is reachable from
 * `bun test`. The viewport turns `toastTimerRemaining` into one `setTimeout`
 * per run and clears it on every pause.
 *
 * A duration of `0` means "until hidden" and is stored as an infinite
 * `remaining`, which no arithmetic here ever brings down to zero.
 */
export type ToastTimer = {
	remaining: number;
	startedAt: number | null;
};

/** A paused clock holding `duration` ms. `0` never expires. */
export function createToastTimer(duration: number): ToastTimer {
	return { remaining: duration > 0 ? duration : Number.POSITIVE_INFINITY, startedAt: null };
}

export function isToastTimerRunning(timer: ToastTimer): boolean {
	return timer.startedAt !== null;
}

/** Starts the clock at `now`. A running clock is returned as it is. */
export function startToastTimer(timer: ToastTimer, now: number): ToastTimer {
	return timer.startedAt === null ? { remaining: timer.remaining, startedAt: now } : timer;
}

/** Stops the clock at `now`, keeping what is left. A paused clock is returned as it is. */
export function pauseToastTimer(timer: ToastTimer, now: number): ToastTimer {
	if (timer.startedAt === null) return timer;
	return { remaining: Math.max(0, timer.remaining - (now - timer.startedAt)), startedAt: null };
}

/** Carries on from where `pauseToastTimer` left it. */
export function resumeToastTimer(timer: ToastTimer, now: number): ToastTimer {
	return startToastTimer(timer, now);
}

/** Milliseconds left at `now` — `Infinity` for a toast that stays until hidden. */
export function toastTimerRemaining(timer: ToastTimer, now: number): number {
	if (timer.startedAt === null) return timer.remaining;
	return Math.max(0, timer.remaining - (now - timer.startedAt));
}

export function isToastTimerExpired(timer: ToastTimer, now: number): boolean {
	return toastTimerRemaining(timer, now) <= 0;
}
