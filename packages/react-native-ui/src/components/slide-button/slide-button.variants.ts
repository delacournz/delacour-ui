import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * What the action the slide confirms means.
 *
 * There is no `primary`. The handle is neutral, so a primary rail with a neutral
 * handle draws the same picture as `secondary` in any theme whose primary sits
 * close to its foreground — two names for one look. See AGENTS.md.
 */
export const SLIDE_BUTTON_VARIANTS = ["secondary", "destructive", "success"] as const;

/** The button's own label steps, so a slide button lines up with a button beside it. */
export const SLIDE_BUTTON_SIZES = ["sm", "md", "lg"] as const;

export type SlideButtonVariant = (typeof SLIDE_BUTTON_VARIANTS)[number];
export type SlideButtonSize = (typeof SLIDE_BUTTON_SIZES)[number];

export const SLIDE_BUTTON_DEFAULT_VARIANT: SlideButtonVariant = "secondary";
export const SLIDE_BUTTON_DEFAULT_SIZE: SlideButtonSize = "md";

/** How far along the travel a release has to reach to confirm. */
export const SLIDE_BUTTON_DEFAULT_THRESHOLD = 0.9;

/** The lowest threshold accepted. Below it a nudge would confirm, which is a tap with extra steps. */
export const SLIDE_BUTTON_MIN_THRESHOLD = 0.1;

/**
 * How far the handle sits inside the rail on every side, in points.
 *
 * Written into the `thumb` slot as `start-1 top-1 bottom-1` and subtracted at
 * both ends by {@link resolveSlideTravel}; a test pins the number.
 */
export const SLIDE_BUTTON_INSET = 4;

/** The handle's width over its height — a stadium, wider than a switch's knob. */
export const SLIDE_BUTTON_HANDLE_RATIO = 1.6;

/**
 * How far ahead a release looks, in seconds of its own velocity.
 *
 * Small on purpose: enough that a finger already committed to the end does not
 * have to drag the last few points, not enough that a flick does the work.
 */
export const SLIDE_BUTTON_LOOKAHEAD = 0.08;

/**
 * How far short of the threshold the *hand* may be when a flick carries it over.
 *
 * Without it the look-ahead alone would let a hard flick from halfway confirm,
 * which is exactly the habit-driven swipe this control exists to refuse.
 */
export const SLIDE_BUTTON_ARM_SLACK = 0.25;

/** How close to the far end counts as there, in points, when the threshold is 1. */
export const SLIDE_BUTTON_FAR_END_SLOP = 0.5;

/**
 * The spring a release settles on, either way.
 *
 * Damped a little under critical: the handle travelling home after a short
 * release should land, not bounce, but a hint of give tells the hand it was
 * heard. A test keeps the damping ratio above 0.7.
 */
export const SLIDE_BUTTON_SPRING = { damping: 22, mass: 0.6, stiffness: 260 } as const;

/** How long the chevron takes to cross into a tick, and how long a reduced-motion move takes. */
export const SLIDE_BUTTON_GLYPH_MS = 180;
export const SLIDE_BUTTON_REDUCED_MOTION_MS = 180;

/** How long a confirmed handle rests at the end before `isAutoReset` takes it home. */
export const SLIDE_BUTTON_DEFAULT_AUTO_RESET_MS = 1000;

/**
 * The gesture's activation window, in points.
 *
 * Horizontal movement past 8 takes the drag; vertical movement past 12 fails it
 * first, so a scroll that begins on the rail stays a scroll.
 */
export const SLIDE_BUTTON_ACTIVE_OFFSET_X = 8;
export const SLIDE_BUTTON_FAIL_OFFSET_Y = 12;

/** The token the handle's glyph is drawn in. A colour value, read through `useThemeColor`. */
export const SLIDE_BUTTON_GLYPH_TOKEN = "foreground";

/**
 * Styling for every part of a slide button.
 *
 * The rail is the same box `Button` draws at each size — `h-button-*` and
 * `rounded-button-*` — so a slide button stacks level with any button above or
 * below it. The handle is neutral in every variant; only the rail, the trail and
 * the label take the variant's colour. The label's colour sits on the label,
 * never the rail (rule 1).
 *
 * Every positioned part uses logical insets (`start-*`), so under RTL the handle
 * rests at the right with nothing else said.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const slideButtonVariants = tv({
	slots: {
		root: "relative justify-center overflow-hidden",
		trail: "absolute start-0 top-0 bottom-0",
		label: "absolute start-0 end-0 px-4 text-center font-semibold",
		thumb:
			"absolute start-1 top-1 bottom-1 items-center justify-center rounded-full border border-border bg-background",
		thumbGlyph: "",
	},
	variants: {
		variant: {
			secondary: {
				root: "bg-secondary",
				trail: "bg-foreground/15",
				label: "text-secondary-foreground",
			},
			destructive: {
				root: "bg-destructive-soft",
				trail: "bg-destructive",
				label: "text-destructive-soft-foreground",
			},
			success: {
				root: "bg-success-soft",
				trail: "bg-success",
				label: "text-success-soft-foreground",
			},
		},
		size: {
			sm: { root: "h-button-sm rounded-button-sm", label: "text-button-sm", thumbGlyph: "size-icon-sm" },
			md: { root: "h-button-md rounded-button-md", label: "text-button-md", thumbGlyph: "size-icon-md" },
			lg: { root: "h-button-lg rounded-button-lg", label: "text-button-lg", thumbGlyph: "size-icon-lg" },
		},
		isFullWidth: {
			true: { root: "w-full self-stretch" },
			false: { root: "w-72 self-start" },
		},
		isDisabled: {
			true: { root: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		variant: SLIDE_BUTTON_DEFAULT_VARIANT,
		size: SLIDE_BUTTON_DEFAULT_SIZE,
		isFullWidth: false,
		isDisabled: false,
	},
});

/**
 * The threshold a slide button actually uses.
 *
 * Undefined and NaN take the default — NaN would otherwise fail every comparison
 * and leave a control that can never confirm. Anything else is clamped into
 * [0.1, 1].
 */
export function resolveSlideThreshold(threshold?: number): number {
	if (threshold === undefined || Number.isNaN(threshold)) return SLIDE_BUTTON_DEFAULT_THRESHOLD;
	return Math.min(1, Math.max(SLIDE_BUTTON_MIN_THRESHOLD, threshold));
}

/**
 * How far the handle can move, in points: the rail less the handle and an inset
 * at each end. Zero before layout, never negative.
 *
 * Marked `"worklet"` and written flat — see `resolveSwitchRelease` for why a
 * module-scope worklet calls nothing.
 */
export function resolveSlideTravel({
	railWidth,
	handleWidth,
	inset,
}: {
	railWidth: number;
	handleWidth: number;
	inset: number;
}): number {
	"worklet";
	const travel = railWidth - handleWidth - inset * 2;
	return travel > 0 ? travel : 0;
}

/**
 * The handle's width from the rail's measured height.
 *
 * Measured rather than tabulated, so a consumer who retunes `--spacing-button-*`
 * keeps a handle in proportion without touching this file.
 */
export function resolveSlideHandleWidth({ railHeight, inset }: { railHeight: number; inset: number }): number {
	"worklet";
	const height = railHeight - inset * 2;
	return height > 0 ? Math.round(height * SLIDE_BUTTON_HANDLE_RATIO) : 0;
}

/**
 * Whether the handle is far enough along that letting go here would confirm —
 * what the arming haptic reports.
 *
 * With a threshold of 1 that is the far end, less half a point of slop.
 */
export function isSlideArmed({
	offset,
	travel,
	threshold,
}: {
	offset: number;
	travel: number;
	threshold: number;
}): boolean {
	"worklet";
	if (travel <= 0) return false;
	if (threshold >= 1) return offset >= travel - SLIDE_BUTTON_FAR_END_SLOP;
	return offset / travel >= threshold;
}

export type SlideRelease = "complete" | "return";

/**
 * Where a release sends the handle.
 *
 * `velocity` is already in the travel direction (flipped under RTL). The release
 * looks a little ahead — `offset + velocity * lookahead` — and confirms when that
 * projection reaches the threshold **and** the hand itself got within
 * {@link SLIDE_BUTTON_ARM_SLACK} of it. The second condition is what stops a hard
 * flick from halfway confirming.
 *
 * A threshold of 1 has no shortcut at all: only a release at the far end confirms.
 */
export function resolveSlideRelease({
	offset,
	velocity,
	travel,
	threshold,
	lookahead,
}: {
	offset: number;
	velocity: number;
	travel: number;
	threshold: number;
	lookahead: number;
}): SlideRelease {
	"worklet";
	if (travel <= 0) return "return";
	if (threshold >= 1) return offset >= travel - SLIDE_BUTTON_FAR_END_SLOP ? "complete" : "return";

	const projected = (offset + velocity * lookahead) / travel;
	const reached = offset / travel;
	return projected >= threshold && reached >= threshold - SLIDE_BUTTON_ARM_SLACK ? "complete" : "return";
}

export type SlideButtonVariantProps = VariantProps<typeof slideButtonVariants>;
