import { calmMotion } from "../../lib/calm-motion";
import { BADGE_FOREGROUND_TOKEN, type BadgeColor, type BadgeSize, badgeVariants } from "../badge/badge.variants";

/** What the badge says. `loading` draws a spinner and marks the badge busy. */
export const ANIMATED_BADGE_STATUSES = ["neutral", "info", "success", "warning", "destructive", "loading"] as const;

/** A subset of `Badge`'s scale, so the two sit level at the same name. */
export const ANIMATED_BADGE_SIZES = ["sm", "md"] as const satisfies readonly BadgeSize[];

export type AnimatedBadgeStatus = (typeof ANIMATED_BADGE_STATUSES)[number];
export type AnimatedBadgeSize = (typeof ANIMATED_BADGE_SIZES)[number];

/**
 * The `Badge` colour each status paints with, on `Badge`'s soft row.
 *
 * `neutral` and `loading` share the neutral fill: work in flight has no verdict
 * yet, and the spinner already says it is moving.
 */
export const ANIMATED_BADGE_COLOR: Record<AnimatedBadgeStatus, BadgeColor> = {
	neutral: "default",
	info: "info",
	success: "success",
	warning: "warning",
	destructive: "destructive",
	loading: "default",
};

/**
 * Gap between the glyph and the label, restated per size.
 *
 * The glyph and the label move as one unit, so they sit in a row of their own
 * inside the root and the root's gap never reaches between them. A test pins
 * each entry to the gap `Badge`'s root sets at the same size.
 */
const CONTENT_GAP: Record<AnimatedBadgeSize, string> = {
	sm: "gap-1",
	md: "gap-1.5",
};

/** How far the content travels as it rolls out and in, in points. A roll, not a slide. */
export const ROLL_DISTANCE = 6;

/** How long the outgoing content takes to leave. Quick: the new state waits on it. */
export const ROLL_OUT_MS = 120;

/** The incoming content's spring. Damped enough not to wobble on a word. */
export const ROLL_IN_SPRING = { damping: 18, stiffness: 260, mass: 0.6 } as const;

/** The capsule's spring to a new width. */
export const RESIZE_SPRING = { damping: 22, stiffness: 240, mass: 0.8 } as const;

/** One breath of the pulse, out and back. */
export const PULSE_CYCLE_MS = 1600;

/** The lowest opacity the pulse dims the glyph to. */
export const PULSE_MIN_OPACITY = 0.55;

/** The largest the pulse swells the glyph to. */
export const PULSE_MAX_SCALE = 1.12;

/**
 * Width of the off-screen canvas the measurer lays the next content out on.
 *
 * The measurer is absolutely positioned inside the root, and Yoga caps an
 * absolute child's available width at its parent's — so without a canvas wider
 * than any label, a narrow badge would wrap the next word and report the
 * wrapped width.
 */
export const MEASURE_CANVAS_WIDTH = 2000;

/** The token a composed glyph, or the spinner, takes its colour from. */
export function resolveAnimatedBadgeForeground(status: AnimatedBadgeStatus): string {
	return BADGE_FOREGROUND_TOKEN.soft[ANIMATED_BADGE_COLOR[status]];
}

export type AnimatedBadgeSlots = {
	root: string;
	content: string;
	label: string;
	icon: string;
};

/**
 * The badge's classes: `Badge`'s soft slots for the status's colour, verbatim.
 *
 * Read from `badgeVariants` rather than restated, so an `AnimatedBadge` and a
 * `Badge` of the same size can never drift apart in padding, type or icon step.
 */
export function resolveAnimatedBadgeSlots({
	status,
	size = "md",
	className,
	labelClassName,
}: {
	status: AnimatedBadgeStatus;
	size?: AnimatedBadgeSize;
	className?: string;
	labelClassName?: string;
}): AnimatedBadgeSlots {
	const slots = badgeVariants({ variant: "soft", color: ANIMATED_BADGE_COLOR[status], size });
	return {
		root: slots.root({ className }),
		content: `flex-row items-center ${CONTENT_GAP[size]}`,
		label: slots.label({ className: labelClassName }),
		icon: slots.icon(),
	};
}

/**
 * The label as one string, when it is text — a string, a number, or an array of
 * only those, joined the way `Badge` joins a run (`{n} reviews`).
 *
 * `undefined` for anything else: an element's words are not this function's to
 * read.
 */
export function resolveAnimatedBadgeText(children: unknown): string | undefined {
	if (typeof children === "string" || typeof children === "number") return String(children);
	if (Array.isArray(children) && children.length > 0) {
		const parts: string[] = [];
		for (const child of children) {
			if (typeof child !== "string" && typeof child !== "number") return undefined;
			parts.push(String(child));
		}
		return parts.join("");
	}
	return undefined;
}

/**
 * What a roll keys on. A change in this string rolls the badge; the same string
 * across a re-render does nothing.
 *
 * `contentKey` wins, then the label's words, then the status alone — a label
 * that is an element rolls only when the status changes, since its words cannot
 * be read here.
 */
export function resolveAnimatedBadgeKey({
	status,
	children,
	contentKey,
}: {
	status: AnimatedBadgeStatus;
	children: unknown;
	contentKey?: string | number;
}): string {
	if (contentKey !== undefined) return `${status}:${contentKey}`;
	const text = resolveAnimatedBadgeText(children);
	return text === undefined ? status : `${status}:${text}`;
}

export type AnimatedBadgeGlyphKind = "spinner" | "icon" | "none";

/**
 * Which glyph leads the label.
 *
 * `showIcon: false` draws nothing. A custom icon is the caller's explicit word
 * and beats the default — `loading` included. Otherwise `loading` spins and
 * every other status draws its own icon.
 */
export function resolveAnimatedBadgeGlyphKind({
	status,
	showIcon = true,
	hasCustomIcon,
}: {
	status: AnimatedBadgeStatus;
	showIcon?: boolean;
	hasCustomIcon: boolean;
}): AnimatedBadgeGlyphKind {
	if (!showIcon) return "none";
	if (hasCustomIcon) return "icon";
	return status === "loading" ? "spinner" : "icon";
}

export type AnimatedBadgeMotion = {
	/** Roll the content out and in on a change. `false` swaps it in place. */
	roll: boolean;
	/** How the capsule reaches a new width. */
	resize: "spring" | "instant";
	/** Spring the badge to a new position when the layout around it moves. */
	layout: boolean;
	/** Swell the glyph in a loop. */
	pulse: boolean;
};

/**
 * Which of the badge's motions run.
 *
 * Reduce motion cuts everything over: the content swaps, the width jumps, the
 * badge does not slide, and nothing pulses. The app's `isMotionCalm` — for an
 * E2E runner waiting on the screen to settle — stills only the pulse, the one
 * motion that never ends; a roll and a spring settle on their own.
 */
export function resolveAnimatedBadgeMotion({
	isReduceMotion,
	isMotionCalm,
	pulse,
	status,
	animateLayout,
}: {
	isReduceMotion: boolean;
	isMotionCalm: boolean;
	pulse?: boolean;
	status: AnimatedBadgeStatus;
	animateLayout: boolean;
}): AnimatedBadgeMotion {
	const wantsPulse = pulse ?? status === "loading";
	return {
		roll: !isReduceMotion,
		resize: isReduceMotion ? "instant" : "spring",
		layout: animateLayout && !isReduceMotion,
		pulse: wantsPulse && !calmMotion({ isReduceMotion, isMotionCalm }),
	};
}
