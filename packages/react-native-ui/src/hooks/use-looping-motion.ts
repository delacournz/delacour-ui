import { useCallback, useMemo, useSyncExternalStore } from "react";
import { type AccessibilityActionEvent, AccessibilityInfo } from "react-native";
import type { MotionLabels } from "../lib/labels";
import {
	LOOPING_MOTION_ACTION,
	type LoopingMotionHold,
	resolveLoopingMotion,
	resolveLoopingMotionActions,
	resolveLoopingMotionToggleLabel,
} from "../lib/looping-motion";
import { useCalmMotion } from "./use-calm-motion";
import { useControllableState } from "./use-controllable-state";
import { useLabels } from "./use-labels";

type Listener = () => void;

/**
 * One subscription to the screen reader for the whole app, however many loops are mounted — a Flow
 * with fifty marching edges holds one listener, not fifty. The last value is cached, so a loop
 * mounted after the first answer starts held rather than moving until its own query resolves.
 */
const screenReader = (() => {
	let isEnabled = false;
	const listeners = new Set<Listener>();
	let subscription: { remove: () => void } | null = null;

	const set = (next: boolean): void => {
		if (next === isEnabled) return;
		isEnabled = next;
		for (const listener of listeners) listener();
	};

	return {
		subscribe(listener: Listener): () => void {
			listeners.add(listener);
			if (subscription === null) {
				subscription = AccessibilityInfo.addEventListener("screenReaderChanged", set);
				AccessibilityInfo.isScreenReaderEnabled().then(set, () => {});
			}
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0 && subscription !== null) {
					subscription.remove();
					subscription = null;
				}
			};
		},
		getSnapshot: (): boolean => isEnabled,
		/** Test-only: forget the cached value and the subscription. */
		reset(): void {
			subscription?.remove();
			subscription = null;
			listeners.clear();
			isEnabled = false;
		},
	};
})();

/** Clears the shared screen-reader cache. For tests; an app never calls it. */
export function resetScreenReaderStore(): void {
	screenReader.reset();
}

/**
 * Whether a screen reader is on — subscribed, not sampled, so turning VoiceOver or TalkBack on
 * mid-loop holds the loop. One shared subscription backs every caller.
 */
export function useScreenReaderEnabled(): boolean {
	return useSyncExternalStore(screenReader.subscribe, screenReader.getSnapshot, screenReader.getSnapshot);
}

export type UseLoopingMotionOptions = {
	/** Controlled pause. Leave `undefined` to let the hook hold it. */
	isPaused?: boolean;
	/** The pause an uncontrolled loop starts with. Default `false`. */
	defaultPaused?: boolean;
	onPausedChange?: (isPaused: boolean) => void;
	/** The component's own `labels` overrides for the pause control. */
	labels?: Partial<MotionLabels>;
};

export type LoopingMotion = {
	/** Why the loop is not moving, or `none`. */
	hold: LoopingMotionHold;
	/** Nothing holds it — run the loop. */
	isMoving: boolean;
	/** Calm motion or a screen reader holds it — show the rest state. A user pause freezes instead. */
	isAtRest: boolean;
	/** The user's pause, whether or not a system hold also applies. */
	isPaused: boolean;
	pause: () => void;
	resume: () => void;
	/** Pause when moving, resume when paused. Does nothing under a system hold. */
	toggle: () => void;
	/** Spread onto the loop's single accessible element: pause/resume as custom actions. */
	accessibilityActions: { name: string; label: string }[];
	onAccessibilityAction: (event: AccessibilityActionEvent) => void;
	/** A visible toggle's accessible name, or `null` while a system hold leaves it nothing to do. */
	toggleLabel: string | null;
};

/**
 * The one place a looping animation asks whether to move (WCAG 2.2.2 Pause, Stop, Hide).
 *
 * Holds the loop under calm motion (`useCalmMotion`) or while a screen reader is on, and gives the
 * user a pause of their own — controlled or not — reachable three ways: the returned
 * `accessibilityActions` on an element that is already a single accessible element, a visible
 * toggle wired to `toggle` with `toggleLabel`, or the component's controlled `isPaused` prop driven
 * by the app's own control.
 *
 * A *transition* — a panel opening, a preview lifting — is not a loop: it ends by itself, so it
 * reads `useCalmMotion` directly rather than this.
 */
export function useLoopingMotion({
	isPaused: isPausedProp,
	defaultPaused = false,
	onPausedChange,
	labels: ownLabels,
}: UseLoopingMotionOptions = {}): LoopingMotion {
	const isCalm = useCalmMotion();
	const isScreenReader = useScreenReaderEnabled();
	const labels = useLabels("motion", ownLabels);
	const [isPaused, setPaused] = useControllableState({
		value: isPausedProp,
		defaultValue: defaultPaused,
		onChange: onPausedChange,
	});

	const { hold, isMoving, isAtRest } = resolveLoopingMotion({ isCalm, isScreenReader, isPaused });

	const pause = useCallback(() => setPaused(true), [setPaused]);
	const resume = useCallback(() => setPaused(false), [setPaused]);
	const toggle = useCallback(() => {
		if (hold === "none") setPaused(true);
		else if (hold === "paused") setPaused(false);
	}, [hold, setPaused]);

	const onAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const { actionName } = event.nativeEvent;
			if (actionName === LOOPING_MOTION_ACTION.pause) setPaused(true);
			else if (actionName === LOOPING_MOTION_ACTION.resume) setPaused(false);
		},
		[setPaused]
	);

	const accessibilityActions = useMemo(() => resolveLoopingMotionActions(hold, labels), [hold, labels]);

	return {
		hold,
		isMoving,
		isAtRest,
		isPaused,
		pause,
		resume,
		toggle,
		accessibilityActions,
		onAccessibilityAction,
		toggleLabel: resolveLoopingMotionToggleLabel(hold, labels),
	};
}
