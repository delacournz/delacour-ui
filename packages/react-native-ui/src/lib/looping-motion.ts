import type { MotionLabels } from "./labels";

/**
 * Why a looping animation is not moving — or `none`, when it is.
 *
 * - `calm` — reduce motion or the app's `isMotionCalm`. The loop goes to its **rest** state.
 * - `screen-reader` — a screen reader is on (WCAG 2.2.2). Also a rest state: a half-typed phrase or
 *   a strip caught mid-travel reads worse than the whole thing still.
 * - `paused` — the user paused it. The loop **freezes where it is**, so resuming carries on.
 * - `none` — nothing holds it.
 */
export type LoopingMotionHold = "none" | "calm" | "screen-reader" | "paused";

export type LoopingMotionState = {
	hold: LoopingMotionHold;
	/** Nothing holds the loop. */
	isMoving: boolean;
	/** The system holds it — show the rest state, not a frozen frame. */
	isAtRest: boolean;
};

/** The custom accessibility action names a looping component offers. */
export const LOOPING_MOTION_ACTION = { pause: "pause", resume: "resume" } as const;

/**
 * Whether a looping animation moves, and if not, why. Calm motion outranks a screen reader, which
 * outranks the user's pause: the two system holds rest the loop, and the user's only freezes it.
 */
export function resolveLoopingMotion({
	isCalm,
	isScreenReader,
	isPaused,
}: {
	isCalm: boolean;
	isScreenReader: boolean;
	isPaused: boolean;
}): LoopingMotionState {
	const hold: LoopingMotionHold = isCalm ? "calm" : isScreenReader ? "screen-reader" : isPaused ? "paused" : "none";
	return { hold, isMoving: hold === "none", isAtRest: hold === "calm" || hold === "screen-reader" };
}

/**
 * The accessibility actions to offer: pause while moving, resume only after the user paused. A
 * system hold offers nothing — there is nothing the user could resume.
 */
export function resolveLoopingMotionActions(
	hold: LoopingMotionHold,
	labels: MotionLabels
): { name: string; label: string }[] {
	if (hold === "none") return [{ name: LOOPING_MOTION_ACTION.pause, label: labels.pause }];
	if (hold === "paused") return [{ name: LOOPING_MOTION_ACTION.resume, label: labels.resume }];
	return [];
}

/** A visible pause toggle's name — what pressing it does — or `null` under a system hold, when it has nothing to do. */
export function resolveLoopingMotionToggleLabel(hold: LoopingMotionHold, labels: MotionLabels): string | null {
	if (hold === "none") return labels.pause;
	if (hold === "paused") return labels.resume;
	return null;
}
