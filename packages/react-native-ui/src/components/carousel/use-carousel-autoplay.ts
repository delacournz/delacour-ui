import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";
import { resolveAutoplayEnabled } from "./carousel.variants";

type UseCarouselAutoplayOptions = {
	autoplay: boolean;
	interval: number;
	isCalm: boolean;
	isDisabled: boolean;
	count: number;
	/** Advances one slide. Returns `true` when there is nowhere further to go, which stops autoplay. */
	onTick: () => boolean;
};

/**
 * Advances the carousel on a JS interval, and knows every reason not to.
 *
 * - **Stops for good** on the first touch, an arrow, or `scrollTo` from a caller —
 *   `stop()` — and at the end of a run that does not loop. Content that keeps
 *   moving after the user took hold of it is fighting them.
 * - **Never starts** under reduce motion or while a screen reader is on (WCAG
 *   2.2.2): moving content the user did not ask for. The screen reader is
 *   subscribed, not sampled, so turning VoiceOver on mid-run stops it.
 * - **Pauses** while the app is in the background and resumes when it returns.
 *
 * A carousel scrolled off-screen keeps ticking: knowing that cheaply is not
 * possible, so it is documented rather than solved.
 *
 * The tick goes through the same reconcile path as `scrollTo`, so autoplay is
 * one more caller of the one position, not a second clock.
 */
export function useCarouselAutoplay({
	autoplay,
	interval,
	isCalm,
	isDisabled,
	count,
	onTick,
}: UseCarouselAutoplayOptions): { stop: () => void } {
	const [isStopped, setIsStopped] = useState(false);
	const [isScreenReader, setIsScreenReader] = useState(false);
	const [isActive, setIsActive] = useState(AppState.currentState !== "background");

	useEffect(() => {
		let isMounted = true;
		AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
			if (isMounted) setIsScreenReader(enabled);
		});
		const reader = AccessibilityInfo.addEventListener("screenReaderChanged", setIsScreenReader);
		const app = AppState.addEventListener("change", (status) => setIsActive(status === "active"));
		return () => {
			isMounted = false;
			reader.remove();
			app.remove();
		};
	}, []);

	const tick = useRef(onTick);
	tick.current = onTick;

	const isRunning =
		!isStopped && isActive && resolveAutoplayEnabled({ autoplay, count, isCalm, isDisabled, isScreenReader });

	useEffect(() => {
		if (!isRunning) return;
		const id = setInterval(() => {
			if (tick.current()) setIsStopped(true);
		}, interval);
		return () => clearInterval(id);
	}, [interval, isRunning]);

	const stop = useCallback(() => setIsStopped(true), []);
	return { stop };
}
