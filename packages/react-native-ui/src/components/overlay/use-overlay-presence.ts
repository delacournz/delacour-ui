import { useCallback, useEffect, useState } from "react";
import { Easing, type SharedValue, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { OVERLAY_MOTION } from "./overlay.variants";
import { isPresent, type PresenceEvent, type PresencePhase, presenceTarget, reducePresence } from "./overlay-presence";

export type UseOverlayPresenceOptions = {
	isOpen: boolean;
	/** Entrance duration, ms. Default `OVERLAY_MOTION.enterMs`. */
	enterMs?: number;
	/** Exit duration, ms. Default `OVERLAY_MOTION.exitMs`. */
	exitMs?: number;
	/** The entrance finished — the moment to move accessibility focus in. */
	onEntered?: () => void;
	/** The exit finished and the overlay is about to unmount. */
	onExited?: () => void;
};

export type OverlayPresence = {
	/** Keep the overlay mounted while true: from the open until the exit animation ends. */
	isPresent: boolean;
	/** 0 hidden → 1 shown, animated on the UI thread. Drive opacity and transforms from it. */
	progress: SharedValue<number>;
	/** Reduce motion is on: drop scales and translates, keep the fade. */
	isReduced: boolean;
	phase: PresencePhase;
};

const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);

/**
 * Keeps an overlay mounted through its exit animation and drives its
 * `progress` from 0 to 1 and back.
 *
 * `isOpen` is the owner's state; this follows it through `reducePresence`,
 * which is what lets a re-open during the exit reverse smoothly from wherever
 * the animation is. The finish of each animation reaches React through
 * `scheduleOnRN`, and only when the animation ran to the end — an interrupted
 * one reports nothing, and the reducer drops a stale finish anyway.
 *
 * Under reduce motion the fade still runs — an opacity change is not motion —
 * and `isReduced` tells the component to drop its transforms.
 */
export function useOverlayPresence({
	isOpen,
	enterMs = OVERLAY_MOTION.enterMs,
	exitMs = OVERLAY_MOTION.exitMs,
	onEntered,
	onExited,
}: UseOverlayPresenceOptions): OverlayPresence {
	const [phase, setPhase] = useState<PresencePhase>(isOpen ? "entering" : "closed");
	const progress = useSharedValue(0);
	const isReduced = useReducedMotion();

	const send = useCallback((event: PresenceEvent) => {
		setPhase((current) => reducePresence(current, event));
	}, []);

	const finishEnter = useCallback(() => {
		send({ type: "entered" });
		onEntered?.();
	}, [send, onEntered]);

	const finishExit = useCallback(() => {
		send({ type: "exited" });
		onExited?.();
	}, [send, onExited]);

	useEffect(() => {
		send({ type: isOpen ? "open" : "close" });
	}, [isOpen, send]);

	useEffect(() => {
		if (phase === "entering") {
			progress.value = withTiming(presenceTarget(phase), { duration: enterMs, easing: ENTER_EASING }, (finished) => {
				if (finished) scheduleOnRN(finishEnter);
			});
		} else if (phase === "exiting") {
			progress.value = withTiming(presenceTarget(phase), { duration: exitMs, easing: EXIT_EASING }, (finished) => {
				if (finished) scheduleOnRN(finishExit);
			});
		}
	}, [phase, progress, enterMs, exitMs, finishEnter, finishExit]);

	return { isPresent: isPresent(phase), progress, isReduced, phase };
}
