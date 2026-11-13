/**
 * Screen-reader announcements, decided once for every component.
 *
 * The two platforms disagree on how a change is spoken. iOS has no live regions — VoiceOver ignores
 * `accessibilityLiveRegion` — so a change is only heard when it is announced. Android speaks a live
 * region whenever its content changes, and it speaks `announceForAccessibility` too, so a component
 * that does both is heard twice. Every component therefore picks one route per platform, here:
 *
 * | Platform | Route |
 * | --- | --- |
 * | iOS | an announcement — queued behind current speech when polite, cutting in when assertive |
 * | Android | a live region by default; an announcement when the component asks for one — never both |
 * | web and others | a live region (`aria-live`); there is no announcement API to call |
 *
 * Android's announcement channel is for what a live region cannot do: speak on mount (a live region
 * reliably speaks a change, not an appearance), or be throttled (a live region speaks every change,
 * so a value that streams — a stepper held down, a clock — floods TalkBack).
 *
 * The announcer throttles and coalesces. Messages share a window per key: the first is spoken at
 * once, a repeat inside the window is dropped, and anything else inside it waits for the window to
 * close and is replaced by whatever arrives after it — so a burst is heard as its first and last
 * message, never as every step between. Without a key the message is its own key, so distinct
 * messages never hold each other back and only exact repeats coalesce.
 *
 * Free of React Native imports, so the routing and the timing are unit-testable; the platform
 * binding is `hooks/use-announce`.
 */

/** How urgently a message is spoken. `assertive` interrupts current speech; `polite` waits for it. */
export type AnnouncePoliteness = "polite" | "assertive";

/** Which mechanism Android uses. iOS always announces and the web always uses a live region. */
export type AnnounceChannel = "live-region" | "announcement";

/** The value `accessibilityLiveRegion` takes. */
export type AnnounceLiveRegion = "none" | AnnouncePoliteness;

/** What a component does to be heard on the current platform. */
export type AnnounceRoute =
	| { kind: "silent" }
	| { kind: "announcement"; queue: boolean }
	| { kind: "live-region"; politeness: AnnouncePoliteness };

/** The window in milliseconds within which messages on one key coalesce. */
export const ANNOUNCE_INTERVAL_MS = 500;

/**
 * The one route a component takes to be heard — never two, so Android cannot speak a message twice.
 *
 * `enabled: false` is the opt-out: silent everywhere, and no live region either.
 */
export function resolveAnnounceRoute({
	platform,
	politeness = "polite",
	channel = "live-region",
	enabled = true,
}: {
	platform: string;
	politeness?: AnnouncePoliteness;
	channel?: AnnounceChannel;
	enabled?: boolean;
}): AnnounceRoute {
	if (!enabled) return { kind: "silent" };
	const queue = politeness === "polite";
	if (platform === "ios" || platform === "macos") return { kind: "announcement", queue };
	if (platform === "android" && channel === "announcement") return { kind: "announcement", queue };
	return { kind: "live-region", politeness };
}

/** The `accessibilityLiveRegion` a route asks for: its politeness on a live-region route, else `none`. */
export function resolveLiveRegion(route: AnnounceRoute): AnnounceLiveRegion {
	return route.kind === "live-region" ? route.politeness : "none";
}

/** One message to speak. */
export type AnnounceRequest = {
	message: string;
	/** Messages sharing a key coalesce. Defaults to the message itself. */
	key?: string;
	politeness?: AnnouncePoliteness;
	/** Overrides the announcer's window for this key, in milliseconds. */
	interval?: number;
};

/** What became of a request: spoken now, held for the end of the window, or dropped. */
export type AnnounceOutcome = "spoken" | "deferred" | "dropped";

/** The platform's speech and clock, injected so the timing is testable. */
export type AnnouncerDriver<Handle> = {
	speak: (message: string, options: { queue: boolean }) => void;
	now: () => number;
	schedule: (callback: () => void, ms: number) => Handle;
	cancel: (handle: Handle) => void;
	interval?: number;
};

export type Announcer = {
	announce: (request: AnnounceRequest) => AnnounceOutcome;
	/** Drops a key's pending message, if any. */
	cancel: (key: string) => void;
	/** Forgets every window and pending message. */
	reset: () => void;
};

type Pending = { message: string; politeness: AnnouncePoliteness };

type Slot<Handle> = {
	at: number;
	message: string;
	interval: number;
	pending: Pending | null;
	timer: Handle | null;
};

/** A throttling, coalescing announcer over `driver`. */
export function createAnnouncer<Handle>(driver: AnnouncerDriver<Handle>): Announcer {
	const fallbackInterval = driver.interval ?? ANNOUNCE_INTERVAL_MS;
	const slots = new Map<string, Slot<Handle>>();

	const speak = (message: string, politeness: AnnouncePoliteness) =>
		driver.speak(message, { queue: politeness === "polite" });

	const clearTimer = (slot: Slot<Handle>) => {
		if (slot.timer !== null) driver.cancel(slot.timer);
		slot.timer = null;
	};

	const prune = (now: number) => {
		for (const [key, slot] of slots) {
			if (slot.pending === null && now - slot.at >= slot.interval) slots.delete(key);
		}
	};

	const flush = (key: string) => {
		const slot = slots.get(key);
		if (!slot) return;
		slot.timer = null;
		const pending = slot.pending;
		if (pending === null) return;
		slot.pending = null;
		slot.at = driver.now();
		slot.message = pending.message;
		speak(pending.message, pending.politeness);
	};

	return {
		announce({ message, key, politeness = "polite", interval = fallbackInterval }) {
			const text = message.trim();
			if (text === "") return "dropped";
			const id = key ?? text;
			const now = driver.now();
			prune(now);
			const slot = slots.get(id);

			if (!slot || now - slot.at >= slot.interval) {
				if (slot) clearTimer(slot);
				slots.set(id, { at: now, message: text, interval, pending: null, timer: null });
				speak(text, politeness);
				return "spoken";
			}

			slot.interval = interval;
			if (text === slot.message) {
				clearTimer(slot);
				slot.pending = null;
				return "dropped";
			}
			slot.pending = { message: text, politeness };
			if (slot.timer === null) slot.timer = driver.schedule(() => flush(id), slot.at + interval - now);
			return "deferred";
		},
		cancel(key) {
			const slot = slots.get(key);
			if (!slot) return;
			clearTimer(slot);
			slot.pending = null;
		},
		reset() {
			for (const slot of slots.values()) clearTimer(slot);
			slots.clear();
		},
	};
}
