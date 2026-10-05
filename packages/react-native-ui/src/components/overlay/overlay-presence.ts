/**
 * Where an overlay is in its life: absent, arriving, shown, or leaving.
 *
 * `exiting` is the whole reason this exists — an overlay that unmounted the
 * moment it closed would have no exit animation to play.
 */
export type PresencePhase = "closed" | "entering" | "open" | "exiting";

export type PresenceEvent =
	/** The owner asked for it to show. */
	| { type: "open" }
	/** The owner asked for it to hide. */
	| { type: "close" }
	/** The entrance animation finished. */
	| { type: "entered" }
	/** The exit animation finished. */
	| { type: "exited" };

/**
 * The presence machine as a pure reducer.
 *
 * A re-open during the exit reverses into `entering` from wherever the
 * animation is, and a close during the entrance reverses into `exiting`. A
 * finish event from an animation that was interrupted — `entered` while
 * already `exiting` — is stale and changes nothing, so the hook needs no
 * generation counter to drop it.
 */
export function reducePresence(phase: PresencePhase, event: PresenceEvent): PresencePhase {
	switch (event.type) {
		case "open":
			return phase === "closed" || phase === "exiting" ? "entering" : phase;
		case "close":
			return phase === "entering" || phase === "open" ? "exiting" : phase;
		case "entered":
			return phase === "entering" ? "open" : phase;
		case "exited":
			return phase === "exiting" ? "closed" : phase;
	}
}

/** Whether the overlay is mounted: every phase but `closed`. */
export function isPresent(phase: PresencePhase): boolean {
	return phase !== "closed";
}

/** The progress value the phase animates toward — 1 shown, 0 hidden. */
export function presenceTarget(phase: PresencePhase): 0 | 1 {
	return phase === "entering" || phase === "open" ? 1 : 0;
}
