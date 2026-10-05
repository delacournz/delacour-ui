import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * What the run between the arrows shows. `numbers` is a fixed-width run of page
 * numbers and gaps; `compact` is one "3 / 12" readout; `simple` is the two
 * arrows alone, labelled "Previous" and "Next".
 */
export const PAGINATION_VARIANTS = ["numbers", "compact", "simple"] as const;

export const PAGINATION_SIZES = ["sm", "md"] as const;

export type PaginationVariant = (typeof PAGINATION_VARIANTS)[number];
export type PaginationSize = (typeof PAGINATION_SIZES)[number];

/**
 * The axes and counts a pagination falls back to when the call site names none.
 *
 * Named once because two places read them — the root's destructure and, for
 * the size, `defaultVariants` below. A test pins the pair.
 */
export const PAGINATION_DEFAULT_VARIANT: PaginationVariant = "numbers";
export const PAGINATION_DEFAULT_SIZE: PaginationSize = "md";
export const PAGINATION_DEFAULT_SIBLINGS = 1;
export const PAGINATION_DEFAULT_BOUNDARIES = 1;
export const PAGINATION_DEFAULT_PAGE_JUMP = 5;

/** How long the current page's fill takes to cross-fade. Reduce motion snaps it. */
export const PAGINATION_FILL_DURATION_MS = 150;

/** The smallest target a thumb is promised, in points. */
export const PAGINATION_MIN_TARGET = 44;

/**
 * Slop on every side of each target, in points.
 *
 * An `sm` target draws at 36 (`--spacing-button-sm`) and reaches 44 with four
 * either side. The run's `sm` gap is eight, so one target's slop meets its
 * neighbour's exactly and never overlaps it — an overlap would hand the press to
 * whichever sibling happens to sit later in the tree. The suite reads both
 * numbers back out of `tokens.css` and the `run` slot.
 */
export const PAGINATION_HIT_SLOP: Record<PaginationSize, number> = { sm: 4, md: 0 };

/** One entry in the run: a page, or a gap that jumps the way it points. */
export type PaginationToken = { kind: "page"; page: number } | { kind: "ellipsis"; direction: -1 | 1 };

/** Which end a control moves toward. */
export type PaginationDirection = "previous" | "next";

/** Floors a sibling or boundary setting at a non-negative integer. */
function whole(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * A page clamped into `[1, max(1, count)]`, rounded to an integer.
 *
 * `NaN` lands on 1 — the one page that always exists, even with nothing to show.
 */
export function clampPage(page: number, count: number): number {
	const last = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
	if (Number.isNaN(page)) return 1;
	return Math.min(last, Math.max(1, Math.round(page)));
}

/**
 * How many tokens a run holds once the count is too large to show whole:
 * `2 × boundaries + 2 × siblings + 3` — both ends, both sides of the current
 * page, the current page and the two slots either side of the window.
 */
export function resolvePaginationRunLength(siblings: number, boundaries: number): number {
	return 2 * whole(boundaries) + 2 * whole(siblings) + 3;
}

/** The pages from `start` to `end`, inclusive, as page tokens. */
function pageRange(start: number, end: number): PaginationToken[] {
	const tokens: PaginationToken[] = [];
	for (let page = start; page <= end; page++) tokens.push({ kind: "page", page });
	return tokens;
}

/**
 * The run of page numbers and gaps to draw.
 *
 * **Fixed length.** Once `count` exceeds {@link resolvePaginationRunLength},
 * every page of it draws exactly that many tokens, so the number the reader is
 * aiming at never slides out from under their thumb as the window moves. The
 * window slides inside the run instead: it is pinned against an end until the
 * current page is far enough in to centre it.
 *
 * **An ellipsis never hides one page.** The slot either side of the window is a
 * gap only when it stands for two or more pages; standing for one, it shows that
 * page — the same width, with nothing hidden behind a "…" that would take a tap
 * to reveal a single number.
 *
 * An out-of-range page is drawn as its clamp. No pages draws no run.
 */
export function resolvePaginationRange({
	count,
	page,
	siblings,
	boundaries,
}: {
	count: number;
	page: number;
	siblings: number;
	boundaries: number;
}): PaginationToken[] {
	const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
	if (total === 0) return [];

	const sib = whole(siblings);
	const bound = whole(boundaries);
	const current = clampPage(page, total);

	if (total <= resolvePaginationRunLength(sib, bound)) return pageRange(1, total);

	const windowStart = Math.max(Math.min(current - sib, total - bound - 2 * sib - 1), bound + 2);
	const windowEnd = Math.min(Math.max(current + sib, bound + 2 * sib + 2), total - bound - 1);

	const leading: PaginationToken =
		windowStart > bound + 2 ? { direction: -1, kind: "ellipsis" } : { kind: "page", page: bound + 1 };
	const trailing: PaginationToken =
		windowEnd < total - bound - 1 ? { direction: 1, kind: "ellipsis" } : { kind: "page", page: total - bound };

	return [
		...pageRange(1, bound),
		leading,
		...pageRange(windowStart, windowEnd),
		trailing,
		...pageRange(total - bound + 1, total),
	];
}

/** Where tapping a gap lands: `jump` pages the way it points, clamped. */
export function resolveEllipsisTarget(page: number, direction: -1 | 1, jump: number, count: number): number {
	return clampPage(page + direction * Math.max(0, jump), count);
}

/** Whether there is a page before and a page after this one. */
export function resolveControlState(page: number, count: number): { canPrevious: boolean; canNext: boolean } {
	const current = clampPage(page, count);
	return { canNext: current < count, canPrevious: current > 1 };
}

/** Only a different page is a change — a re-press of the current page stays quiet. */
export function shouldEmitPage(current: number, next: number): boolean {
	return current !== next;
}

/**
 * The page to report when the one held is out of range, or `undefined` when it
 * is fine.
 *
 * The root renders the clamp at once and reports it from an effect, so a
 * controlled `page` left behind by a shrinking result set is corrected once
 * rather than every render.
 */
export function resolvePageCorrection(page: number, count: number): number | undefined {
	const clamped = clampPage(page, count);
	return clamped === page ? undefined : clamped;
}

export type PaginationStatusRange = { from: number; to: number; total: number };

/**
 * The rows the current page shows, one-based and inclusive: page 3 of 20 a page
 * is rows 41–60. A page past the end shows the last page's rows; nothing to show
 * is `0–0 of 0`.
 */
export function resolvePaginationStatus({
	page,
	pageSize,
	total,
}: {
	page: number;
	pageSize: number;
	total: number;
}): PaginationStatusRange {
	if (!(total > 0) || !(pageSize > 0)) return { from: 0, to: 0, total: 0 };
	const current = clampPage(page, Math.ceil(total / pageSize));
	return { from: (current - 1) * pageSize + 1, to: Math.min(current * pageSize, total), total };
}

/** "41–60 of 472". English in v1. */
export function formatPaginationStatus({ from, to, total }: PaginationStatusRange): string {
	return `${from}–${to} of ${total}`;
}

/** The compact readout — "3 / 12". */
export function formatCompact(page: number, count: number): string {
	return `${page} / ${count}`;
}

/** The compact readout as VoiceOver reads it — "Page 3 of 12". */
export function formatCompactAccessibilityValue(page: number, count: number): string {
	return `Page ${page} of ${count}`;
}

/** An item's accessible name — "Page 3". */
export function formatPageLabel(page: number): string {
	return `Page ${page}`;
}

/** A gap's accessible name — "Jump forward 5 pages". */
export function formatEllipsisLabel(direction: -1 | 1, jump: number): string {
	return `Jump ${direction === 1 ? "forward" : "back"} ${jump} ${jump === 1 ? "page" : "pages"}`;
}

/**
 * Which way a control's chevron points. Previous points to the start, which is
 * the right under a right-to-left layout.
 */
export function resolveControlGlyph(direction: PaginationDirection, isRTL: boolean): "left" | "right" {
	const towardStart = direction === "previous";
	return towardStart !== isRTL ? "left" : "right";
}

/** The token an item's label is painted in — `itemLabel` emits the same one as a class. */
export function resolveItemForeground(isCurrent: boolean): string {
	return isCurrent ? "primary-foreground" : "foreground";
}

/** The token a control's chevron is painted in — `controlLabel` emits the same one as a class. */
export function resolveControlForeground(): string {
	return "foreground";
}

/**
 * Styling for every part of a pagination.
 *
 * One slotted `tv()` because the item, control, ellipsis and compact files cannot
 * import the root without closing a cycle (AGENTS.md rule 3) yet all of them read
 * the same `size`.
 *
 * **Every target is a square at least as wide as it is tall**, on the button
 * scale — `h-button-*` with `min-w-button-*` — so "7" and "128" share a height
 * and a three-digit page grows sideways rather than clipping.
 *
 * **The fade lands on each element, never on the root.** A control already
 * disabled at its end would otherwise fade twice under a disabled root.
 * `Pressable` multiplies a className's opacity into its press, so the
 * `opacity-50` survives the animated style.
 *
 * **The current page's fill is its own layer** (`fill`), under the label, so it
 * can cross-fade while the label's colour changes outright.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const paginationVariants = tv({
	slots: {
		/** The outer row — leading content, then the run. Takes the caller's `className`. */
		root: "flex-row items-center justify-center gap-3",
		/** The arrows, numbers and gaps, on the trailing edge. */
		run: "flex-row items-center",
		/** One page number. */
		item: "items-center justify-center overflow-hidden",
		/** The current page's fill, behind the label. */
		fill: "absolute inset-0 rounded-full bg-primary",
		/** The number — a `Text`, so it owns its colour (rule 1). */
		itemLabel: "font-medium",
		/** The previous or next arrow. */
		control: "flex-row items-center justify-center gap-1",
		/** The chevron's size class, handed to its `IconDefaultsProvider`. */
		glyph: "",
		/** "Previous" / "Next" beside the chevron, when shown. */
		controlLabel: "font-medium text-foreground",
		/** A gap that jumps `pageJump` pages. */
		ellipsis: "items-center justify-center",
		/** The "…" itself. */
		ellipsisLabel: "text-muted-foreground",
		/** The compact "3 / 12" readout. */
		compact: "items-center justify-center px-2",
		/** The readout's text. */
		compactLabel: "font-medium text-foreground",
		/** Leading content — grows to push the run to the trailing edge. */
		summary: "min-w-0 flex-1",
		/** "41–60 of 472". */
		status: "text-muted-foreground",
	},
	variants: {
		size: {
			sm: {
				run: "gap-2",
				item: "h-button-sm min-w-button-sm rounded-button-sm px-1.5",
				itemLabel: "text-sm",
				control: "h-button-sm min-w-button-sm rounded-button-sm",
				controlLabel: "text-sm",
				glyph: "size-icon-sm",
				ellipsis: "h-button-sm min-w-button-sm",
				ellipsisLabel: "text-sm",
				compact: "h-button-sm",
				compactLabel: "text-sm",
				status: "text-xs",
			},
			md: {
				run: "gap-1",
				item: "h-button-md min-w-button-md rounded-button-md px-2",
				itemLabel: "text-base",
				control: "h-button-md min-w-button-md rounded-button-md",
				controlLabel: "text-base",
				glyph: "size-icon-md",
				ellipsis: "h-button-md min-w-button-md",
				ellipsisLabel: "text-base",
				compact: "h-button-md",
				compactLabel: "text-base",
				status: "text-sm",
			},
		},
		isCurrent: {
			true: { itemLabel: "text-primary-foreground" },
			false: { itemLabel: "text-foreground" },
		},
		hasLabel: {
			true: { control: "px-3" },
			false: {},
		},
		isDisabled: {
			true: { item: "opacity-50", control: "opacity-50", ellipsis: "opacity-50", compact: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		size: PAGINATION_DEFAULT_SIZE,
		isCurrent: false,
		hasLabel: false,
		isDisabled: false,
	},
});

export type PaginationVariantProps = VariantProps<typeof paginationVariants>;
