import { useCallback, useEffect, useId, useRef } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import {
	type AnnounceChannel,
	type AnnounceLiveRegion,
	type AnnounceOutcome,
	type AnnouncePoliteness,
	createAnnouncer,
	resolveAnnounceRoute,
	resolveLiveRegion,
} from "../lib/announce";

/**
 * The app-wide announcer: one window per key across every component, so two components announcing
 * the same message in the same instant are heard once.
 */
const announcer = createAnnouncer<ReturnType<typeof setTimeout>>({
	speak: (message, { queue }) => {
		if (Platform.OS === "ios") {
			AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue });
		} else {
			AccessibilityInfo.announceForAccessibility(message);
		}
	},
	now: () => Date.now(),
	schedule: (callback, ms) => setTimeout(callback, ms),
	cancel: (handle) => clearTimeout(handle),
});

export type AnnounceOptions = {
	/** `assertive` interrupts current speech on iOS; `polite` (default) waits behind it. */
	politeness?: AnnouncePoliteness;
	/** Messages sharing a key coalesce within the window. Defaults to the message itself. */
	key?: string;
	/** The coalescing window for this key, in milliseconds. */
	interval?: number;
	/** `false` is the opt-out: nothing is spoken. */
	enabled?: boolean;
};

/**
 * Speaks `message` through the platform's announcement API, throttled and coalesced.
 *
 * This is the announcement route on every platform, so call it only for a message no live region
 * on screen also carries — on Android, a live region holding the same text would speak it again.
 * For text that is also rendered, use `useAnnouncement`, which picks one route per platform.
 */
export function announce(message: string, { enabled = true, ...request }: AnnounceOptions = {}): AnnounceOutcome {
	if (!enabled) return "dropped";
	return announcer.announce({ message, ...request });
}

/**
 * `announce`, keyed to this component instance: a burst from one instance is heard as its first and
 * last message, and anything still pending is dropped when the instance unmounts.
 */
export function useAnnounce(): (message: string, options?: AnnounceOptions) => AnnounceOutcome {
	const id = useId();
	useEffect(() => () => announcer.cancel(id), [id]);
	return useCallback((message, options = {}) => announce(message, { key: id, ...options }), [id]);
}

export type UseAnnouncementOptions = AnnounceOptions & {
	/**
	 * Android's route. `live-region` (default) lets TalkBack speak each change of the view's content;
	 * `announcement` speaks through the announcer instead — throttled, and able to speak on mount.
	 */
	channel?: AnnounceChannel;
	/** Speak the first message too, not only later changes. Pair with `channel: "announcement"` on Android. */
	onMount?: boolean;
};

/**
 * Makes a component's changing text heard, by exactly one route per platform.
 *
 * Returns the `accessibilityLiveRegion` to spread on the view that renders `message`. On iOS — and
 * on Android with `channel: "announcement"` — that is `none` and the hook announces each new
 * message itself; on Android's default live-region channel, and on the web, the live region does
 * the speaking and the hook announces nothing. The message is never spoken twice.
 *
 * A `null`, `undefined` or empty message is silence, and returning to it says nothing.
 */
export function useAnnouncement(
	message: string | null | undefined,
	{ channel, onMount = false, enabled = true, politeness = "polite", key, interval }: UseAnnouncementOptions = {}
): { accessibilityLiveRegion: AnnounceLiveRegion } {
	const id = useId();
	const announceKey = key ?? id;
	const route = resolveAnnounceRoute({ platform: Platform.OS, politeness, channel, enabled });
	const previous = useRef(onMount ? null : (message ?? null));

	// Keyed on the message: compared with the last one seen, so a remount in development
	// (Strict Mode runs effects twice) does not speak the same message again.
	// biome-ignore lint/correctness/useExhaustiveDependencies: only a new message speaks; the route is read as rendered
	useEffect(() => {
		const next = message ?? null;
		if (next === previous.current) return;
		previous.current = next;
		if (route.kind !== "announcement" || next === null) return;
		announcer.announce({ message: next, key: announceKey, politeness, interval });
	}, [message]);

	useEffect(() => () => announcer.cancel(announceKey), [announceKey]);

	return { accessibilityLiveRegion: resolveLiveRegion(route) };
}

/** Forgets every pending announcement and window — for tests. */
export function resetAnnouncer(): void {
	announcer.reset();
}
