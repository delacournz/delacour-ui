import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** How many lines tall the field is before it grows, when `minRows` is not named. */
export const FEEDBACK_DEFAULT_MIN_ROWS = 6;

/** The tallest the field grows before it scrolls, when `maxRows` is not named. */
export const FEEDBACK_DEFAULT_MAX_ROWS = 12;

/**
 * How long the well takes to follow a change in its content's height — a
 * multi-step swap, or a line added while typing. Short, so a new line is never
 * clipped for long, and finite, so an E2E runner's settle wait ends.
 */
export const FEEDBACK_PANEL_RESIZE_MS = 200;

/**
 * Points per line of the field — the `leading-6` its slot sets. The test reads
 * the class back, so the two cannot drift apart.
 */
export const FEEDBACK_FIELD_LINE_HEIGHT = 24;

/**
 * Styling for every part of a feedback dialog.
 *
 * The shell is `Dialog.Content` with these classes merged over the dialog's
 * own, so `content` only names what differs from a confirm dialog: the muted
 * band and a tighter padding, which is what makes the well read as inset.
 * Everything else — the corner, the hairline, the width cap — stays Dialog's.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const feedbackVariants = tv({
	slots: {
		/** The shell: the dialog's card, on the band colour, with a tight inset around the well. */
		content: "gap-2 bg-muted p-2",
		/**
		 * The animated clip around the well. Its height follows the well's on a
		 * timing; its corner matches the well's so nothing pokes out mid-resize.
		 */
		clip: "overflow-hidden rounded-md",
		/**
		 * The recessed well: the page colour, one step down the corner ramp from
		 * the card it sits in so the two read as nested, and a hairline. Relative
		 * so the corner ✕ positions against it rather than the shell.
		 */
		panel: "relative gap-2 overflow-hidden rounded-md border border-border bg-background p-4",
		/** Clearance for `Feedback.Close`, and nothing else — the type is `Text.Header`'s. */
		title: "pr-8",
		close: "absolute top-3 right-3 z-10",
		/**
		 * A raw `TextInput` with no box: the well is the box. It restates
		 * `font-sans` for the reason `Input`'s field does — a `TextInput`
		 * inherits nothing — and sets paragraph leading, which its min height
		 * is counted in.
		 */
		field: "p-0 font-sans text-foreground text-input-md leading-6",
		/** Narrower than the well's inset, so the actions sit on the band rather than in it. */
		footer: "flex-row items-center justify-end gap-2 px-1 pb-1",
	},
});

export type FeedbackVariantProps = VariantProps<typeof feedbackVariants>;

export type CanSubmitFeedbackInput = {
	/** The draft as typed. */
	value: string;
	/** Allow an empty message — when chips or a rating carry the answer. Default false. */
	canSubmitEmpty?: boolean;
	/** The submit is off — disabled by the caller, or a send already in flight. Default false. */
	isDisabled?: boolean;
};

/**
 * Whether `Feedback.Submit` can be pressed.
 *
 * Whitespace is empty: a message of three spaces sends nothing, and `onSubmit`
 * receives the trimmed text anyway. Disabled outranks `canSubmitEmpty`.
 *
 * Pure, so it is reachable from `bun test`. See AGENTS.md.
 */
export function canSubmitFeedback({
	value,
	canSubmitEmpty = false,
	isDisabled = false,
}: CanSubmitFeedbackInput): boolean {
	if (isDisabled) return false;
	if (canSubmitEmpty) return true;
	return value.trim().length > 0;
}

/**
 * The field's minimum height, in points — `minRows` lines of `lineHeight`.
 *
 * A style, never a class: a runtime `` `min-h-[${n}px]` `` is never compiled by
 * Tailwind's static scanner. A bad row count degrades the way `Textarea`'s
 * does — floored to whole lines, clamped to one, the default on `NaN`.
 *
 * Pure, so it is reachable from `bun test`. See AGENTS.md.
 */
export function resolveFeedbackFieldMinHeight(minRows: number | undefined, lineHeight: number): number {
	const rows =
		minRows === undefined || !Number.isFinite(minRows) ? FEEDBACK_DEFAULT_MIN_ROWS : Math.max(1, Math.floor(minRows));
	return rows * lineHeight;
}

/**
 * The field's height bounds, as a style: floored at `minRows`, capped at
 * `maxRows`, and between the two React Native's multiline `TextInput` sizes
 * itself to its text. Past the cap it scrolls — a dialog that grew without
 * one would push its footer under the keyboard.
 *
 * A ceiling below the floor is lifted up to it, so the field never shrinks as
 * it grows. Pure, so it is reachable from `bun test`. See AGENTS.md.
 */
export function resolveFeedbackFieldHeightStyle({
	minRows,
	maxRows,
	lineHeight = FEEDBACK_FIELD_LINE_HEIGHT,
}: {
	minRows?: number;
	maxRows?: number;
	lineHeight?: number;
}): { minHeight: number; maxHeight: number } {
	const minHeight = resolveFeedbackFieldMinHeight(minRows, lineHeight);
	const ceiling = resolveFeedbackFieldMinHeight(maxRows ?? FEEDBACK_DEFAULT_MAX_ROWS, lineHeight);
	return { maxHeight: Math.max(minHeight, ceiling), minHeight };
}
