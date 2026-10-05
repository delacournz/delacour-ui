import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** Where the jump button floats along the bottom edge of the list. */
export const MESSAGE_SCROLLER_JUMP_PLACEMENTS = ["center", "end"] as const;

export type MessageScrollerJumpPlacement = (typeof MESSAGE_SCROLLER_JUMP_PLACEMENTS)[number];

/**
 * The list content's gutter: horizontal only, and the same string `Screen.ChatList` uses, so a
 * conversation drawn by either sits on the same column.
 *
 * No vertical padding. A bubble carries its own vertical rhythm, and the bottom of the list is a
 * computed reserve (the composer clearance) — padding there would push the newest message off it.
 */
export const MESSAGE_SCROLLER_CONTENT_CLASS = "px-screen-gutter";

/** How long the jump button takes to appear or leave. */
export const MESSAGE_SCROLLER_JUMP_TIMING_MS = 160;

/** How far below its resting place the jump button starts its slide, in points. */
const JUMP_SLIDE_PX = 8;

/**
 * Styling for every part of a message scroller.
 *
 * - **No size axis.** A scroller has no intrinsic size; the caller's `className` on the root decides
 *   it. The root is `flex-1` and never clips: the jump button floats inside it and a row's own
 *   entrance may overshoot its box.
 * - **`placement` positions the floating layer, not the pill.** The layer spans the list's width
 *   at `bottom-3`, and justifies the pill to the centre or the trailing gutter, so no slot needs a
 *   `self-*` that would fight whatever parent an app puts it in. Its lift above a composer and the
 *   keyboard comes from `bottomInset` and the keyboard's shared value, never from a class.
 * - **The pill is a card with a border and no shadow.** No component in this package draws one —
 *   React Native's shadow props differ by platform — and a bordered card already separates it from
 *   the bubbles behind it. `min-w-11` with the 36pt height plus a hit slop gives a 44pt target.
 * - **Rows carry no spacing between messages.** That rhythm is the bubble's, so there is one source
 *   of it; the separator and divider pad themselves with `py-3`.
 */
export const messageScrollerVariants = tv({
	slots: {
		root: "relative flex-1",
		content: MESSAGE_SCROLLER_CONTENT_CLASS,
		jumpButtonContainer: "absolute inset-x-0 bottom-3 flex-row px-screen-gutter",
		jumpButton:
			"h-9 min-w-11 flex-row items-center justify-center gap-2 rounded-full border border-border bg-card px-3",
		jumpLabel: "text-sm font-medium text-card-foreground",
		jumpCount: "h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5",
		jumpCountLabel: "text-xs font-semibold text-primary-foreground",
		dateSeparator: "flex-row items-center gap-3 py-3",
		dateLabel: "text-xs font-medium text-muted-foreground",
		dateRule: "h-px flex-1 bg-border",
		unreadDivider: "flex-row items-center gap-3 py-3",
		unreadLabel: "text-xs font-medium text-primary",
		unreadRule: "h-px flex-1 bg-primary/40",
		loadingOlder: "items-center justify-center py-3",
	},
	variants: {
		placement: {
			center: { jumpButtonContainer: "justify-center" },
			end: { jumpButtonContainer: "justify-end" },
		},
	},
	defaultVariants: {
		placement: "end",
	},
});

export type MessageScrollerVariantProps = VariantProps<typeof messageScrollerVariants>;

/**
 * Where the jump button animates to: in, it rests at full opacity; out, it fades and drops a few
 * points. Under calm motion it only fades — the slide is the decorative half.
 */
export function resolveJumpButtonMotion(input: { isVisible: boolean; isCalm: boolean }): {
	opacity: number;
	translateY: number;
} {
	"worklet";
	if (input.isVisible) return { opacity: 1, translateY: 0 };
	return { opacity: 0, translateY: input.isCalm ? 0 : JUMP_SLIDE_PX };
}
