import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { InputSize } from "../input/input.variants";

/** How many lines tall a textarea is when `rows` is not named. */
export const TEXTAREA_DEFAULT_ROWS = 4;

/** The tallest a growing textarea goes when `maxRows` is not named. */
export const TEXTAREA_DEFAULT_MAX_ROWS = 10;

/**
 * Points per line of text, by size.
 *
 * A paragraph needs more leading than the one line `Input` sets `leading-tight`
 * for, and a row count only becomes a height once the height of a line is a
 * number. So the number lives here, and the `leading-*` class that sets it lives
 * in {@link textareaVariants} beside it; the two must never disagree.
 */
export const TEXTAREA_LINE_HEIGHTS: Record<InputSize, number> = { sm: 20, md: 24, lg: 28 };

/**
 * Vertical padding either side of the text, by size.
 *
 * A restatement of `Input`'s multiline `py-*` compounds — the box is `Input`'s,
 * so the padding is too. The test resolves `Input`'s class and pins these
 * against it, so a retune there fails here rather than silently mis-sizing
 * every textarea by a few points.
 */
export const TEXTAREA_PADDING_Y: Record<InputSize, number> = { sm: 8, md: 10, lg: 12 };

/** The hairline `Input`'s box draws on every variant, counted top and bottom. */
export const TEXTAREA_BORDER_WIDTH = 1;

/**
 * Styling for the parts a textarea adds around `Input`.
 *
 * Everything the box itself wears — border, fill, corner, focus and invalid —
 * is `Input`'s, and is not restated here. What this adds is the paragraph
 * leading, and the character count that sits under the box.
 *
 * `count` carries no colour class: it renders `Text.Caption`, whose `color`
 * prop is the one place that decision is made — {@link resolveTextareaCount}.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const textareaVariants = tv({
	slots: {
		root: "gap-1.5",
		field: "",
		count: "self-end tabular-nums",
	},
	variants: {
		size: {
			sm: { field: "leading-5" },
			md: { field: "leading-6" },
			lg: { field: "leading-7" },
		},
		// Inside an `Input.Group` the wrapper shares the group's row with the
		// decorators, so it takes the width they leave, as a grouped `Input` does.
		isGrouped: { true: { root: "flex-1" }, false: {} },
	},
	defaultVariants: {
		size: "md",
		isGrouped: false,
	},
});

export type TextareaVariantProps = VariantProps<typeof textareaVariants>;

/**
 * The class the textarea hands `Input` for its field.
 *
 * `Input` merges it after its own field slot, so the `leading-*` here replaces
 * the `leading-tight` that slot sets rather than sitting beside it — and a
 * caller's className, merged last here, still wins over both.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaFieldClass({ size, className }: { size: InputSize; className?: string }): string {
	return textareaVariants({ size }).field({ className });
}

/** A whole, positive line count, or the fallback when the value is not one. */
function wholeRows(value: number | undefined, fallback: number): number {
	if (value === undefined || !Number.isFinite(value)) return fallback;
	return Math.max(1, Math.floor(value));
}

/**
 * The floor and ceiling a textarea is sized between, in lines.
 *
 * A ceiling below the floor is lifted up to it — otherwise a growing field
 * would shrink as it grew.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaRows({ rows, maxRows }: { rows?: number; maxRows?: number }): {
	rows: number;
	maxRows: number;
} {
	const floor = wholeRows(rows, TEXTAREA_DEFAULT_ROWS);
	return { maxRows: Math.max(floor, wholeRows(maxRows, TEXTAREA_DEFAULT_MAX_ROWS)), rows: floor };
}

/**
 * Points tall a box of `rows` lines is: the lines, plus the padding and the
 * border either side.
 *
 * Inside an `Input.Group` the group draws the box — border and vertical
 * padding — around every section at once, so a grouped field is its lines and
 * nothing else. Adding the box back gives exactly the lone height.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaRowsHeight({
	rows,
	size,
	isGrouped = false,
}: {
	rows: number;
	size: InputSize;
	isGrouped?: boolean;
}): number {
	const lines = rows * TEXTAREA_LINE_HEIGHTS[size];
	return isGrouped ? lines : lines + 2 * TEXTAREA_PADDING_Y[size] + 2 * TEXTAREA_BORDER_WIDTH;
}

/**
 * The height a textarea is drawn at, as a style — never a class.
 *
 * A row count is a runtime number, and Tailwind's scanner is static: a
 * `` `h-[${n}px]` `` is never compiled and would resolve to nothing. See
 * AGENTS.md **Sizing**.
 *
 * A fixed field is exactly `rows` tall and scrolls past it. A growing one is
 * floored at `rows` and capped at `maxRows`, and between the two React Native's
 * own multiline `TextInput` sizes itself to its content — no measuring pass, so
 * no frame drawn at the old height after a line is added.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaHeightStyle({
	size,
	rows,
	maxRows,
	autoGrow = false,
	isGrouped = false,
}: {
	size: InputSize;
	rows?: number;
	maxRows?: number;
	autoGrow?: boolean;
	/** Inside an `Input.Group`, which draws the box. */
	isGrouped?: boolean;
}): { height: number } | { minHeight: number; maxHeight: number } {
	const lines = resolveTextareaRows({ maxRows, rows });
	if (!autoGrow) return { height: resolveTextareaRowsHeight({ isGrouped, rows: lines.rows, size }) };
	return {
		maxHeight: resolveTextareaRowsHeight({ isGrouped, rows: lines.maxRows, size }),
		minHeight: resolveTextareaRowsHeight({ isGrouped, rows: lines.rows, size }),
	};
}

/** What the character count shows, announces and is coloured. */
export type TextareaCount = {
	label: string;
	accessibilityLabel: string;
	isAtLimit: boolean;
	color: "muted" | "destructive";
};

/**
 * The character count under a textarea.
 *
 * Turns destructive once the limit is reached, not after it: the native
 * `maxLength` stops typing at the limit, so "over" is a state a person typing
 * can never see, and the count has to say something at the moment typing stops
 * working. A controlled value set past the limit in code still reads as at it.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaCount({ length, maxLength }: { length: number; maxLength: number }): TextareaCount {
	const isAtLimit = length >= maxLength;
	return {
		accessibilityLabel: `${length} of ${maxLength} characters`,
		color: isAtLimit ? "destructive" : "muted",
		isAtLimit,
		label: `${length}/${maxLength}`,
	};
}

/**
 * The most characters remaining that still count as the warning band.
 *
 * The band is a tenth of the limit, capped here, and never less than one
 * character — so a 100 limit warns at 10 left, a 280 or 4000 one at 20, a 10 one at 1.
 */
export const TEXTAREA_WARNING_MAX_REMAINING = 20;

/** Where a length sits against the limit: clear of it, close to it, or at it. */
export type TextareaBand = "none" | "warning" | "limit";

/**
 * Which band a length is in.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaBand({ length, maxLength }: { length: number; maxLength: number }): TextareaBand {
	if (length >= maxLength) return "limit";
	const warnAt = Math.min(TEXTAREA_WARNING_MAX_REMAINING, Math.max(1, Math.ceil(maxLength / 10)));
	return maxLength - length <= warnAt ? "warning" : "none";
}

/** What to say, and how urgently. */
export type TextareaThresholdAnnouncement = { message: string; politeness: "polite" | "assertive" };

/**
 * What to speak when a length moves from `previous` band, or null for silence.
 *
 * Only entering a band speaks: staying in it is silent, and so is leaving it,
 * which re-arms it — deleting back out and typing in again is heard again.
 * Reaching the limit is assertive because typing has just silently stopped
 * working; the warning is polite so it waits behind the typing echo.
 *
 * Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveTextareaThresholdAnnouncement({
	previous,
	length,
	maxLength,
}: {
	previous: TextareaBand;
	length: number;
	maxLength: number;
}): TextareaThresholdAnnouncement | null {
	const next = resolveTextareaBand({ length, maxLength });
	if (next === previous || next === "none") return null;
	if (next === "limit") return { message: "Character limit reached", politeness: "assertive" };
	if (previous === "limit") return null;
	const remaining = maxLength - length;
	return { message: `${remaining} ${remaining === 1 ? "character" : "characters"} remaining`, politeness: "polite" };
}
