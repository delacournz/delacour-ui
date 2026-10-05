import { tv } from "../../lib/tv";

export const MARQUEE_DIRECTIONS = ["left", "right", "up", "down"] as const;
export const MARQUEE_GAPS = ["none", "xs", "sm", "md", "lg", "xl"] as const;

/** Which way the content travels. Encodes the axis and the sign in one value, so no pair of props can disagree. */
export type MarqueeDirection = (typeof MARQUEE_DIRECTIONS)[number];
/** The trailing space after each copy, on the spacing scale. */
export type MarqueeGap = (typeof MARQUEE_GAPS)[number];
export type MarqueeAxis = "horizontal" | "vertical";

/** Theme tokens a fade can blend into; must equal the surface the marquee sits on. */
export type MarqueeFadeColor = "background" | "card" | "muted" | "elevated";

export type MarqueeFade =
	| { kind: "none" }
	| {
			kind: "edges";
			/** How far each fade reaches in from its edge, in points. Default 24. */
			size?: number;
			/** The surface the marquee sits on. Default `background`. */
			color?: MarqueeFadeColor;
	  };

export type MarqueePause =
	| { kind: "none" }
	/** Held while a finger is down anywhere on the strip. */
	| { kind: "press" }
	/** Held while the app says so. */
	| { kind: "controlled"; isPaused: boolean };

/** Points per second with no `speed` from the strip or its group. */
export const MARQUEE_DEFAULT_SPEED = 40;

/** How long the strip takes to slow to a hold, or to get back up to speed. */
export const MARQUEE_DEFAULT_EASE_MS = 250;

/** The longest frame the integrator honours, so a backgrounded app does not teleport the strip. */
export const MARQUEE_MAX_FRAME_MS = 64;

/** The most copies a strip mounts, so a one-point child does not mount a thousand. */
export const MARQUEE_MAX_COPIES = 12;

/** How far an edge fade reaches with no `size`. */
export const MARQUEE_DEFAULT_FADE_SIZE = 24;

/** The pause a strip takes with none of its own and no group. */
export const MARQUEE_DEFAULT_PAUSE: MarqueePause = { kind: "press" };

/** Left and right run along the row; up and down along the column. */
export function resolveMarqueeAxis(direction: MarqueeDirection): MarqueeAxis {
	return direction === "left" || direction === "right" ? "horizontal" : "vertical";
}

/** The sign of the content's travel on its axis: left and up are negative. */
export function resolveMarqueeSign(direction: MarqueeDirection): 1 | -1 {
	return direction === "left" || direction === "up" ? -1 : 1;
}

/**
 * The content's signed velocity in points per second.
 *
 * A speed of zero, a negative speed or a non-finite one holds the strip still —
 * a negative speed reversing the strip would be a second way of saying
 * `direction`, and two ways to say one thing disagree eventually.
 */
export function resolveMarqueeVelocity(direction: MarqueeDirection, speed: number): number {
	if (!Number.isFinite(speed) || speed <= 0) return 0;
	return resolveMarqueeSign(direction) * speed;
}

/**
 * How long one loop takes, in ms, at a speed.
 *
 * Reporting only — docs, tests, an accessibility hint. It never drives the
 * animation: a duration would make a three-badge strip crawl and a thirty-badge
 * strip fly. Speed is the input; this is what it works out to.
 */
export function resolveMarqueeDuration(period: number, speed: number): number {
	if (period <= 0) return 0;
	if (!Number.isFinite(speed) || speed <= 0) return Number.POSITIVE_INFINITY;
	return (period / speed) * 1000;
}

/**
 * How many copies fill the container with one period to spare.
 *
 * The spare is what hides the wrap: while one copy slides out of the leading
 * edge, the next is already wholly in. One copy while the period is unmeasured,
 * never fewer than two once it is, and never more than {@link MARQUEE_MAX_COPIES}.
 */
export function resolveMarqueeCopies(container: number, period: number): number {
	if (!(period > 0)) return 1;
	const fill = Math.ceil(Math.max(container, 0) / period) + 1;
	return Math.min(Math.max(fill, 2), MARQUEE_MAX_COPIES);
}

/**
 * The integrator's step: move `offset` by `velocity` over `dtMs`, wrapped into
 * `[0, period)`.
 *
 * Marked `"worklet"` and written flat, calling nothing but `Math`, because a
 * module-scope worklet that calls a sibling works only while that sibling
 * happens to be declared first. A zero period returns 0 rather than the NaN a
 * modulo by zero would hand the transform.
 */
export function advanceMarqueeOffset(offset: number, dtMs: number, velocity: number, period: number): number {
	"worklet";
	if (!(period > 0)) return 0;
	const next = offset + (dtMs / 1000) * velocity;
	const wrapped = next % period;
	return wrapped < 0 ? wrapped + period : wrapped;
}

/**
 * Where the strip sits for an offset, always within one period behind the
 * leading edge.
 *
 * Left and up sit in `(-period, 0]`, right and down in `[-period, 0)`, so the
 * copies always cover the container from its start edge. The strip is periodic,
 * so `offset = period` draws exactly what `offset = 0` draws — which is the
 * whole reason the wrap is invisible.
 */
export function resolveMarqueeTranslation(offset: number, period: number, direction: MarqueeDirection): number {
	"worklet";
	if (!(period > 0)) return 0;
	const raw = offset % period;
	const wrapped = raw < 0 ? raw + period : raw;
	if (direction === "left" || direction === "up") {
		return wrapped === 0 ? 0 : wrapped - period;
	}
	return wrapped - period;
}

/** A frame's delta in ms, never negative, never NaN and never longer than {@link MARQUEE_MAX_FRAME_MS}. */
export function clampFrameDelta(dtMs: number): number {
	"worklet";
	if (!(dtMs > 0)) return 0;
	return Math.min(dtMs, MARQUEE_MAX_FRAME_MS);
}

/** The fade to draw, defaults applied, or `null` for none. A size of zero or less is none. */
export function resolveMarqueeFade(fade: MarqueeFade): { size: number; color: MarqueeFadeColor } | null {
	if (fade.kind === "none") return null;
	const size = fade.size ?? MARQUEE_DEFAULT_FADE_SIZE;
	if (!(size > 0)) return null;
	return { color: fade.color ?? "background", size };
}

/** The strip's own speed, else its group's, else {@link MARQUEE_DEFAULT_SPEED}. */
export function resolveMarqueeSpeed(own: number | undefined, group: number | undefined): number {
	return own ?? group ?? MARQUEE_DEFAULT_SPEED;
}

/**
 * The pause a strip follows. Inside a group the group's wins, because a group
 * exists to hold its rows in step — a row that kept moving while its sibling
 * held would be the drift the group is there to prevent.
 */
export function resolveMarqueePause(own: MarqueePause | undefined, group: MarqueePause | undefined): MarqueePause {
	return group ?? own ?? MARQUEE_DEFAULT_PAUSE;
}

/** Whether the strip holds, given its pause and whether a finger is down on it (or its group). */
export function resolveMarqueeHeld(pause: MarqueePause, isPressed: boolean): boolean {
	"worklet";
	if (pause.kind === "press") return isPressed;
	if (pause.kind === "controlled") return pause.isPaused;
	return false;
}

/**
 * The marquee's slots.
 *
 * Each copy carries its gap as **trailing padding**, never a `gap-*` between
 * copies: the period is the measured size of one copy, and a gap between them
 * would leave the last one's uncounted, so the loop would jump by one gap on
 * every wrap. The compound variants put the padding on the trailing side of the
 * axis.
 *
 * The root lays out along the axis too, so the track is a main-axis item that
 * keeps its full content size (`shrink-0`) rather than being stretched to the
 * container's. A track only as wide as the container would hit-test only that
 * far: once translated, the copies sliding in from the trailing edge would sit
 * outside its bounds and take no touches.
 */
export const marqueeVariants = tv({
	slots: {
		root: "overflow-hidden",
		track: "shrink-0",
		copy: "shrink-0",
		fade: "absolute",
	},
	variants: {
		axis: {
			horizontal: { root: "flex-row", track: "flex-row", copy: "flex-row items-center", fade: "inset-y-0" },
			vertical: { root: "flex-col", track: "flex-col", copy: "flex-col", fade: "inset-x-0" },
		},
		gap: {
			none: {},
			xs: {},
			sm: {},
			md: {},
			lg: {},
			xl: {},
		},
	},
	compoundVariants: [
		{ axis: "horizontal", gap: "none", class: { copy: "pr-0" } },
		{ axis: "horizontal", gap: "xs", class: { copy: "pr-1" } },
		{ axis: "horizontal", gap: "sm", class: { copy: "pr-2" } },
		{ axis: "horizontal", gap: "md", class: { copy: "pr-4" } },
		{ axis: "horizontal", gap: "lg", class: { copy: "pr-6" } },
		{ axis: "horizontal", gap: "xl", class: { copy: "pr-8" } },
		{ axis: "vertical", gap: "none", class: { copy: "pb-0" } },
		{ axis: "vertical", gap: "xs", class: { copy: "pb-1" } },
		{ axis: "vertical", gap: "sm", class: { copy: "pb-2" } },
		{ axis: "vertical", gap: "md", class: { copy: "pb-4" } },
		{ axis: "vertical", gap: "lg", class: { copy: "pb-6" } },
		{ axis: "vertical", gap: "xl", class: { copy: "pb-8" } },
	],
	defaultVariants: {
		axis: "horizontal",
		gap: "md",
	},
});
