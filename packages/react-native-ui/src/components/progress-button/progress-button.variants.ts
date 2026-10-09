import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const PROGRESS_BUTTON_VARIANTS = ["primary", "secondary", "destructive", "success"] as const;

/** The button's label sizes. A hold needs a label, so there is no square `icon-*` step. */
export const PROGRESS_BUTTON_SIZES = ["sm", "md", "lg"] as const;

/** `pill` takes the button's capsule corner; `rounded` takes the card's `rounded-lg`. */
export const PROGRESS_BUTTON_SHAPES = ["pill", "rounded"] as const;

export type ProgressButtonVariant = (typeof PROGRESS_BUTTON_VARIANTS)[number];
export type ProgressButtonSize = (typeof PROGRESS_BUTTON_SIZES)[number];
export type ProgressButtonShape = (typeof PROGRESS_BUTTON_SHAPES)[number];

/** How long a hold takes when nothing says otherwise. */
export const PROGRESS_BUTTON_DEFAULT_HOLD_MS = 2000;

/** The shortest hold accepted. Anything quicker is a long tap, not a decision. */
export const PROGRESS_BUTTON_MIN_HOLD_MS = 200;

/** How long a completed button waits before `isAutoReset` rewinds it. */
export const PROGRESS_BUTTON_DEFAULT_AUTO_RESET_MS = 1000;

/** How long a reset, or a completion set from outside, takes to travel the whole width. */
export const PROGRESS_BUTTON_TRAVEL_MS = 400;

/** How long the labels and the done mark take to cross-fade. */
export const PROGRESS_BUTTON_CROSSFADE_MS = 200;

/** How far, in points, a resting finger may drift before the hold lets go. */
export const PROGRESS_BUTTON_MAX_DRIFT = 16;

/** How many discrete steps the fill takes under reduced motion. */
export const PROGRESS_BUTTON_REDUCED_MOTION_STEPS = 5;

/** What VoiceOver and TalkBack read after the label when no `accessibilityHint` is given. */
export const PROGRESS_BUTTON_DEFAULT_HINT = "Press and hold to confirm";

/**
 * Theme token each variant fills with.
 *
 * `secondary` fills with the foreground: its resting surface already is
 * `bg-secondary`, and a fill the same colour as the surface under it would not
 * be seen at all.
 */
export const PROGRESS_BUTTON_FILL_TOKEN: Record<ProgressButtonVariant, string> = {
	primary: "primary",
	secondary: "foreground",
	destructive: "destructive",
	success: "success",
};

/** Theme token the resting label, and a composed icon on the surface, are drawn in. */
export const PROGRESS_BUTTON_LABEL_TOKEN: Record<ProgressButtonVariant, string> = {
	primary: "primary",
	secondary: "secondary-foreground",
	destructive: "destructive",
	success: "success",
};

/**
 * Theme token the label copy inside the fill, its icons and the done mark are drawn in.
 *
 * `secondary` draws on `background`, the token `foreground` is the foreground
 * *of* — `secondary-foreground` on a `foreground` fill would be the same colour
 * twice.
 */
export const PROGRESS_BUTTON_FILL_FOREGROUND_TOKEN: Record<ProgressButtonVariant, string> = {
	primary: "primary-foreground",
	secondary: "background",
	destructive: "destructive-foreground",
	success: "success-foreground",
};

/**
 * Styling for every part of a progress button.
 *
 * The box is a button's box: `h-button-*`, the button's `px-*` and, as a pill,
 * `rounded-button-*` — the same tokens `buttonVariants` reads, never new ones,
 * and a test pins them equal. Every variant rests on one surface,
 * `bg-secondary`, and carries its colour in the label and the fill.
 *
 * The label is drawn twice. `label` sits on the surface; `fillLabel` sits inside
 * the clipped fill, laid out in `fillContent` at the button's measured width so
 * both copies wrap the same and the wipe's edge cuts through a glyph rather
 * than between two different layouts. The two differ only in colour — a test
 * asserts it.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const progressButtonVariants = tv({
	slots: {
		root: "relative flex-row items-center justify-center overflow-hidden bg-secondary",
		/** The surface layer: the resting label and anything composed beside it. */
		content: "flex-row items-center justify-center gap-2",
		fill: "absolute inset-y-0 start-0 overflow-hidden",
		/** The fill's inner copy, laid out at the root's measured width. */
		fillContent: "absolute inset-y-0 start-0 flex-row items-center justify-center gap-2",
		label: "text-center font-semibold",
		fillLabel: "text-center font-semibold",
		/** Where the done mark sits: the whole box, on the fill. */
		done: "absolute inset-y-0 start-0 items-center justify-center",
		/** Edge length a composed `Icon`, and the default tick, inherit. */
		icon: "",
	},
	variants: {
		variant: {
			primary: { fill: "bg-primary", label: "text-primary", fillLabel: "text-primary-foreground" },
			secondary: {
				fill: "bg-foreground",
				label: "text-secondary-foreground",
				fillLabel: "text-background",
			},
			destructive: {
				fill: "bg-destructive",
				label: "text-destructive",
				fillLabel: "text-destructive-foreground",
			},
			success: { fill: "bg-success", label: "text-success", fillLabel: "text-success-foreground" },
		},
		// Written out rather than built: Tailwind scans source text, and a class
		// assembled at runtime is never compiled.
		size: {
			sm: {
				root: "h-button-sm px-3",
				content: "gap-1.5",
				fillContent: "gap-1.5 px-3",
				label: "text-button-sm",
				fillLabel: "text-button-sm",
				icon: "size-icon-sm",
			},
			md: {
				root: "h-button-md px-4",
				fillContent: "px-4",
				label: "text-button-md",
				fillLabel: "text-button-md",
				icon: "size-icon-md",
			},
			lg: {
				root: "h-button-lg px-5",
				fillContent: "px-5",
				label: "text-button-lg",
				fillLabel: "text-button-lg",
				icon: "size-icon-lg",
			},
		},
		// The pill's corner depends on the size, so it is a compound cell below.
		shape: { pill: {}, rounded: { root: "rounded-lg" } },
		isFullWidth: { true: { root: "w-full self-stretch" }, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		{ shape: "pill", size: "sm", class: { root: "rounded-button-sm" } },
		{ shape: "pill", size: "md", class: { root: "rounded-button-md" } },
		{ shape: "pill", size: "lg", class: { root: "rounded-button-lg" } },
	],
	defaultVariants: {
		variant: "primary",
		size: "md",
		shape: "pill",
		isFullWidth: false,
		isDisabled: false,
	},
});

export type ProgressButtonVariantProps = VariantProps<typeof progressButtonVariants>;

/**
 * How long a full hold takes, in milliseconds.
 *
 * Defaults to {@link PROGRESS_BUTTON_DEFAULT_HOLD_MS} and is floored at
 * {@link PROGRESS_BUTTON_MIN_HOLD_MS}. A non-finite value — `NaN` from a
 * division somewhere upstream — takes the default rather than a hold that
 * completes instantly or never.
 */
export function resolveHoldDuration(ms?: number): number {
	if (ms === undefined || !Number.isFinite(ms)) return PROGRESS_BUTTON_DEFAULT_HOLD_MS;
	return Math.max(PROGRESS_BUTTON_MIN_HOLD_MS, ms);
}

/** How long a completed button waits before rewinding itself. Non-negative. */
export function resolveAutoResetDelay(ms?: number): number {
	if (ms === undefined || !Number.isFinite(ms)) return PROGRESS_BUTTON_DEFAULT_AUTO_RESET_MS;
	return Math.max(0, ms);
}

/**
 * How long the fill takes to travel from `progress` to its end, at the hold's rate.
 *
 * `forward` is what is left to fill — `holdDuration × (1 − p)` — so a second
 * press resumes rather than restarting. `reverse` is what is filled —
 * `holdDuration × p` — so a release plays the fill back at the same speed it
 * went in, and the two at one point always sum to the whole hold.
 *
 * The worklet that drives the fill restates this inline, because a worklet body
 * must be self-contained; this copy is the one the tests pin.
 */
export function resolveRemainingDuration({
	holdDuration,
	progress,
	direction,
}: {
	holdDuration: number;
	progress: number;
	direction: "forward" | "reverse";
}): number {
	const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
	return holdDuration * (direction === "forward" ? 1 - p : p);
}

/**
 * The fill shown under reduced motion: `progress` rounded down to a step.
 *
 * Down, never to nearest, so the fill never shows more than the hold has
 * earned — a full bar appears only at 1. The animated style restates this
 * inline (worklet bodies must be self-contained); this copy is the tested one.
 */
export function resolveSteppedProgress(progress: number, steps: number = PROGRESS_BUTTON_REDUCED_MOTION_STEPS): number {
	const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
	if (p >= 1) return 1;
	if (!(steps >= 1)) return 0;
	const count = Math.floor(steps);
	return Math.floor(p * count) / count;
}

/** What a screen reader is told about the button's state. Completed reads as checked. */
export function resolveProgressButtonAccessibilityState({
	isDisabled,
	isCompleted,
}: {
	isDisabled: boolean;
	isCompleted: boolean;
}): { disabled: boolean; checked: boolean } {
	return { checked: isCompleted, disabled: isDisabled };
}
