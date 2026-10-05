import { describe, expect, test } from "bun:test";
import {
	createToastTimer,
	isToastTimerExpired,
	isToastTimerRunning,
	pauseToastTimer,
	resumeToastTimer,
	startToastTimer,
	toastTimerRemaining,
} from "./toast.timer";

describe("toast timer", () => {
	test("a new timer holds its whole duration and is not running", () => {
		const timer = createToastTimer(4000);
		expect(timer).toEqual({ remaining: 4000, startedAt: null });
		expect(isToastTimerRunning(timer)).toBe(false);
	});

	test("expires once its duration has run", () => {
		const timer = startToastTimer(createToastTimer(4000), 1000);
		expect(isToastTimerRunning(timer)).toBe(true);
		expect(isToastTimerExpired(timer, 4999)).toBe(false);
		expect(isToastTimerExpired(timer, 5000)).toBe(true);
		expect(toastTimerRemaining(timer, 2500)).toBe(2500);
	});

	test("pausing keeps the time left, and resuming carries on from it", () => {
		const running = startToastTimer(createToastTimer(4000), 0);
		const paused = pauseToastTimer(running, 1500);
		expect(paused).toEqual({ remaining: 2500, startedAt: null });

		// However long it sits paused, nothing is spent.
		expect(isToastTimerExpired(paused, 60_000)).toBe(false);
		expect(toastTimerRemaining(paused, 60_000)).toBe(2500);

		const resumed = resumeToastTimer(paused, 60_000);
		expect(isToastTimerExpired(resumed, 62_499)).toBe(false);
		expect(isToastTimerExpired(resumed, 62_500)).toBe(true);
	});

	test("pausing twice spends nothing the second time", () => {
		const paused = pauseToastTimer(startToastTimer(createToastTimer(4000), 0), 1000);
		expect(pauseToastTimer(paused, 3000)).toBe(paused);
	});

	test("resuming a running timer does not restart it", () => {
		const running = startToastTimer(createToastTimer(4000), 0);
		expect(resumeToastTimer(running, 3000)).toBe(running);
	});

	test("remaining never drops below zero", () => {
		const paused = pauseToastTimer(startToastTimer(createToastTimer(1000), 0), 5000);
		expect(paused.remaining).toBe(0);
		expect(isToastTimerExpired(paused, 5000)).toBe(true);
	});

	test("a zero duration never expires, running or paused", () => {
		const running = startToastTimer(createToastTimer(0), 0);
		expect(isToastTimerExpired(running, Number.MAX_SAFE_INTEGER)).toBe(false);
		expect(toastTimerRemaining(running, 1_000_000)).toBe(Number.POSITIVE_INFINITY);
		const paused = pauseToastTimer(running, 1_000_000);
		expect(isToastTimerExpired(resumeToastTimer(paused, 2_000_000), Number.MAX_SAFE_INTEGER)).toBe(false);
	});
});
