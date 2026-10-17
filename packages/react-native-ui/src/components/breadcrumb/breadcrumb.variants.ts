import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextSize } from "../text/text.variants";

export const BREADCRUMB_SIZES = ["sm", "md"] as const;

/**
 * How a trail too long for the row behaves. `wrap` flows onto a second line,
 * `collapse` folds its middle into an ellipsis crumb, `scroll` runs on in a
 * horizontal scroller opened at the current page.
 */
export const BREADCRUMB_OVERFLOWS = ["wrap", "collapse", "scroll"] as const;

export type BreadcrumbSize = (typeof BREADCRUMB_SIZES)[number];
export type BreadcrumbOverflow = (typeof BREADCRUMB_OVERFLOWS)[number];

/** Named once: `defaultVariants` and the root's destructure both read it. */
export const BREADCRUMB_DEFAULT_SIZE: BreadcrumbSize = "md";

/**
 * The `Text` size step each breadcrumb size hands its labels — `sm` the caption
 * step, `md` the body step. Named rather than restated as a `text-*` class in a
 * slot, the rule `Steps.Title` follows, so the type scale has one owner.
 */
export const BREADCRUMB_TEXT_SIZE: Record<BreadcrumbSize, TextSize> = { sm: "sm", md: "md" };

/** The theme token every separator and ellipsis glyph is drawn in. */
export const BREADCRUMB_GLYPH_COLOR = "muted-foreground";

/** The smallest tap target a link may have, in points. */
export const BREADCRUMB_MIN_TOUCH_TARGET = 44;

type HitSlop = { top: number; bottom: number; left: number; right: number };

/**
 * Slop that lifts a link's one line of text — and the ellipsis, whose box is
 * held to that same line height — to {@link BREADCRUMB_MIN_TOUCH_TARGET}.
 *
 * Vertical only: the line is 20 or 24 points tall, so ten or twelve points above
 * and below reach 44. The sides get a little — enough to forgive a thumb, not
 * enough to reach across the separator into the neighbouring crumb, where a tap
 * between two links would become ambiguous. A test holds the sum to 44.
 */
export const BREADCRUMB_LINK_HIT_SLOP: Record<BreadcrumbSize, HitSlop> = {
	sm: { top: 12, bottom: 12, left: 4, right: 4 },
	md: { top: 10, bottom: 10, left: 4, right: 4 },
};

/**
 * Styling for every part of a breadcrumb.
 *
 * One slotted `tv()` because the list, item, link, page, separator and ellipsis
 * files cannot import the root without closing a cycle (AGENTS.md rule 3), yet
 * all of them read the same `size`.
 *
 * Text colour sits on the label slots — `linkLabel`, `page` — never on `link`,
 * which is a `Pressable`'s view (rule 1). The text *size* is not a slot class at
 * all: each label renders a `Text` at {@link BREADCRUMB_TEXT_SIZE}.
 *
 * `link` fades when disabled. That is safe on a `Pressable` root: it multiplies a
 * className's opacity into its press rather than overwriting it.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const breadcrumbVariants = tv({
	slots: {
		root: "",
		list: "flex-row items-center",
		scroller: "flex-row items-center",
		item: "flex-row items-center",
		link: "flex-row items-center",
		linkLabel: "text-muted-foreground",
		page: "font-medium text-foreground",
		separator: "items-center justify-center",
		glyph: "",
		ellipsis: "flex-row items-center justify-center rounded-sm px-1",
	},
	variants: {
		size: {
			sm: { list: "gap-x-1 gap-y-1", scroller: "gap-x-1", glyph: "size-icon-xs", ellipsis: "h-5" },
			md: { list: "gap-x-1.5 gap-y-1.5", scroller: "gap-x-1.5", glyph: "size-icon-sm", ellipsis: "h-6" },
		},
		overflow: {
			wrap: { list: "flex-wrap" },
			collapse: { list: "flex-wrap" },
			scroll: { list: "flex-nowrap" },
		},
		isDisabled: {
			true: { link: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		size: BREADCRUMB_DEFAULT_SIZE,
		overflow: "wrap",
		isDisabled: false,
	},
});

export type BreadcrumbVariantProps = VariantProps<typeof breadcrumbVariants>;

/**
 * Which items a trail shows. `all`, or the items either side of a hidden run
 * the ellipsis stands in for. Indices count `Breadcrumb.Item`s, zero-based.
 */
export type BreadcrumbCollapse =
	| { kind: "all" }
	| { kind: "collapsed"; visibleBefore: number[]; hidden: number[]; visibleAfter: number[] };

function range(from: number, to: number): number[] {
	const out: number[] = [];
	for (let i = from; i < to; i++) out.push(i);
	return out;
}

/** A count of items to keep, floored and never below zero. */
function settleCount(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Splits a trail of `count` items into the ones shown and the run the ellipsis
 * hides.
 *
 * Never collapses without a `maxItems`, or at or under it. Over it, `before`
 * items lead and `after` trail (both default 1; negative reads as 0). The last
 * item — the current page — always stays, so `after` is at least one, and
 * `before + after` is clamped so at least one item is hidden: a "collapse" that
 * hides nothing would draw an ellipsis standing for no levels. `after` wins
 * that clamp over `before`, since the end of the trail is where the reader is.
 */
export function resolveBreadcrumbCollapse({
	count,
	maxItems,
	before = 1,
	after = 1,
}: {
	count: number;
	maxItems?: number;
	before?: number;
	after?: number;
}): BreadcrumbCollapse {
	if (maxItems === undefined || count <= maxItems || count < 2) return { kind: "all" };

	const trailing = Math.min(Math.max(1, settleCount(after)), count - 1);
	const leading = Math.min(settleCount(before), count - 1 - trailing);

	return {
		kind: "collapsed",
		visibleBefore: range(0, leading),
		hidden: range(leading, count - trailing),
		visibleAfter: range(count - trailing, count),
	};
}

/** The default overflow: `collapse` once a `maxItems` is named, `wrap` otherwise. */
export function resolveBreadcrumbOverflow({
	overflow,
	maxItems,
}: {
	overflow?: BreadcrumbOverflow;
	maxItems?: number;
}): BreadcrumbOverflow {
	if (overflow) return overflow;
	return maxItems === undefined ? "wrap" : "collapse";
}

/** What one direct child of `Breadcrumb.List` is, as far as layout cares. */
export type BreadcrumbChildKind = "item" | "separator" | "other";

/** One thing the list renders, in order. `child` indexes the list's flattened children. */
export type BreadcrumbEntry =
	| { kind: "child"; index: number }
	| { kind: "separator"; key: string }
	| { kind: "ellipsis"; hidden: number[] };

/**
 * The list's render order: its children, the automatic separators between
 * crumbs, and the ellipsis in place of a hidden run.
 *
 * A separator goes before every crumb but the first — so none trails the last —
 * unless the entry just emitted was a separator the caller placed, which
 * stands in for it. A caller's separator that follows a hidden item is hidden
 * with it. Anything that is neither an item nor a separator renders where it
 * was written and takes no separator of its own.
 *
 * An automatic separator's key names the child it precedes, so a crumb keeps
 * the same separator across a re-render that collapses others.
 */
export function resolveBreadcrumbSequence(
	kinds: readonly BreadcrumbChildKind[],
	collapse: BreadcrumbCollapse
): BreadcrumbEntry[] {
	const hidden = new Set(collapse.kind === "collapsed" ? collapse.hidden : []);
	const firstHidden = collapse.kind === "collapsed" ? collapse.hidden[0] : undefined;

	const entries: BreadcrumbEntry[] = [];
	let hasCrumb = false;
	let lastWasSeparator = false;
	let item = -1;
	let previousItemHidden = false;

	const pushCrumb = (entry: BreadcrumbEntry, key: string) => {
		if (hasCrumb && !lastWasSeparator) entries.push({ kind: "separator", key });
		entries.push(entry);
		hasCrumb = true;
		lastWasSeparator = false;
	};

	kinds.forEach((kind, index) => {
		if (kind === "item") {
			item += 1;
			previousItemHidden = hidden.has(item);
			if (item === firstHidden && collapse.kind === "collapsed") {
				pushCrumb({ kind: "ellipsis", hidden: collapse.hidden }, "separator-ellipsis");
			}
			if (previousItemHidden) return;
			pushCrumb({ kind: "child", index }, `separator-${index}`);
			return;
		}
		if (kind === "separator") {
			if (previousItemHidden) return;
			entries.push({ kind: "child", index });
			lastWasSeparator = true;
			return;
		}
		entries.push({ kind: "child", index });
	});

	return entries;
}

/** Which chevron a separator draws: it points along the reading direction. */
export function resolveBreadcrumbSeparatorGlyph(isRTL: boolean): "chevron-right" | "chevron-left" {
	return isRTL ? "chevron-left" : "chevron-right";
}

/**
 * The ellipsis' accessible name. A button offers to show the levels; a static
 * mark only says they are there. With no count it names no number.
 */
export function resolveBreadcrumbEllipsisLabel(hiddenCount: number | undefined, isInteractive: boolean): string {
	const noun = hiddenCount === 1 ? "level" : "levels";
	if (isInteractive) return hiddenCount === undefined ? "Show hidden levels" : `Show ${hiddenCount} hidden ${noun}`;
	return hiddenCount === undefined ? "Hidden levels" : `${hiddenCount} hidden ${noun}`;
}
