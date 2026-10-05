import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** Which screen edge the rail hugs. Logical, so it mirrors in right-to-left. */
export const SECTION_RAIL_PLACEMENTS = ["end", "start"] as const;

/** Where along that edge it sits. `bottom` puts it in the thumb's reach and grows the panel upward. */
export const SECTION_RAIL_ALIGNS = ["center", "bottom"] as const;

export type SectionRailPlacement = (typeof SECTION_RAIL_PLACEMENTS)[number];
export type SectionRailAlign = (typeof SECTION_RAIL_ALIGNS)[number];

/**
 * The defaults a rail falls back to. Named once because both `defaultVariants`
 * below and the root's destructure read them; a test pins the pair.
 */
export const SECTION_RAIL_DEFAULT_PLACEMENT: SectionRailPlacement = "end";
export const SECTION_RAIL_DEFAULT_ALIGN: SectionRailAlign = "center";
/** How long the panel lingers after a pick, in ms, so a mis-tap can be corrected. */
export const SECTION_RAIL_DEFAULT_CLOSE_DELAY = 300;
/** Points between the rail and the safe-area edge it hugs. */
export const SECTION_RAIL_DEFAULT_OFFSET = 12;
/** How wide the panel may grow, as a share of the screen inside its insets. */
export const SECTION_RAIL_DEFAULT_MAX_WIDTH = "78%" as const;

/**
 * The deepest level that still looks different. A bar shorter than `w-2` stops
 * reading as a bar, and the panel's indent stops at the same level so the rail
 * and the list it mirrors never disagree about which sections nest.
 */
export const SECTION_RAIL_MAX_LEVEL = 2;

const BAR_LENGTHS = ["w-4", "w-3", "w-2"] as const;
const ITEM_INDENTS = ["ps-3", "ps-6", "ps-9"] as const;

/** A level as an index into the ladders above: rounded down, and clamped to 0…`SECTION_RAIL_MAX_LEVEL`. */
function clampLevel(level: number): number {
	return Math.min(SECTION_RAIL_MAX_LEVEL, Math.max(0, Math.floor(level)));
}

/** A bar's length for its nesting level. Each level is one step shorter; level 2 and deeper share the shortest. */
export function resolveBarLength(level: number): (typeof BAR_LENGTHS)[number] {
	return BAR_LENGTHS[clampLevel(level)] ?? BAR_LENGTHS[0];
}

/** A panel row's start padding for its nesting level — the indent that mirrors {@link resolveBarLength}. */
export function resolveItemIndent(level: number): (typeof ITEM_INDENTS)[number] {
	return ITEM_INDENTS[clampLevel(level)] ?? ITEM_INDENTS[0];
}

/**
 * The bar under a finger at `y`, in the trigger's coordinates.
 *
 * Bars are a few points tall with gaps between them, so "the bar under the
 * finger" is really "the nearest bar": the boundary between two bars is the
 * midpoint of the gap, and the midpoint itself belongs to the lower one. Past
 * either end it clamps, so a scrub that overshoots the rail stays on the first
 * or last section. `-1` only when there are no bars.
 *
 * A worklet: the scrub pan calls it every frame.
 */
export function resolveScrubIndex(y: number, rowTops: readonly number[], rowHeights: readonly number[]): number {
	"worklet";
	const count = Math.min(rowTops.length, rowHeights.length);
	if (count === 0) return -1;
	for (let index = 0; index < count - 1; index++) {
		const bottom = (rowTops[index] ?? 0) + (rowHeights[index] ?? 0);
		const nextTop = rowTops[index + 1] ?? bottom;
		if (y < (bottom + nextTop) / 2) return index;
	}
	return count - 1;
}

/** Whether a pick is worth reporting: a section, and not the one already active. */
export function shouldEmitSection(current: string | undefined, next: string | undefined): next is string {
	"worklet";
	return next !== undefined && next !== current;
}

/**
 * The section one step from `current` in rail order — what an assistive
 * increment or decrement moves to. Stops at the ends rather than wrapping: an
 * outline has a first and a last section, and wrapping would jump the reader
 * from the end of the document to its top with one swipe. From no section (or
 * one the rail does not hold) forward is the first and back is nothing.
 */
export function resolveAdjacentSection(
	order: readonly string[],
	current: string | undefined,
	direction: 1 | -1
): string | undefined {
	const index = current === undefined ? -1 : order.indexOf(current);
	if (index === -1) return direction === 1 ? order[0] : undefined;
	return order[index + direction];
}

export type SectionRailInsets = { top: number; bottom: number; left: number; right: number };

/** Plain numbers and flex keywords — a React Native style, without importing React Native. */
export type SectionRailPlacementStyle = {
	alignItems: "flex-start" | "flex-end";
	justifyContent: "center" | "flex-end";
	paddingTop: number;
	paddingBottom: number;
	paddingStart: number;
	paddingEnd: number;
};

/**
 * The padding and alignment of the full-screen frame the rail and the panel are
 * each positioned in.
 *
 * Both sit in a frame that fills the root and is padded to the safe area, so a
 * percentage `maxWidth` on the panel is a share of the usable screen rather than
 * of a box with no width of its own. The rail's own edge, and the bottom edge
 * under `align="bottom"`, clear their inset by `offset` as well.
 *
 * The insets are physical (`left`/`right`, as the safe-area context reports
 * them) and the padding logical, so in right-to-left the `end` edge reads the
 * left inset.
 */
export function resolveRailPlacementStyle(
	placement: SectionRailPlacement,
	align: SectionRailAlign,
	insets: SectionRailInsets,
	offset: number,
	isRTL: boolean
): SectionRailPlacementStyle {
	const startInset = isRTL ? insets.right : insets.left;
	const endInset = isRTL ? insets.left : insets.right;
	return {
		alignItems: placement === "end" ? "flex-end" : "flex-start",
		justifyContent: align === "bottom" ? "flex-end" : "center",
		paddingBottom: insets.bottom + (align === "bottom" ? offset : 0),
		paddingEnd: endInset + (placement === "end" ? offset : 0),
		paddingStart: startInset + (placement === "start" ? offset : 0),
		paddingTop: insets.top,
	};
}

export type SectionRailPanelAnchor = {
	horizontal: SectionRailPlacement;
	vertical: SectionRailAlign;
};

/** The corner the panel grows from: the rail's own edge, at its middle or — aligned to the bottom — its bottom corner. */
export function resolvePanelAnchor(placement: SectionRailPlacement, align: SectionRailAlign): SectionRailPanelAnchor {
	return { horizontal: placement, vertical: align };
}

/**
 * The panel's `transformOrigin` for an anchor. `transformOrigin` is physical,
 * so the logical edge is mapped onto a side here, flipped in right-to-left.
 */
export function resolvePanelTransformOrigin(anchor: SectionRailPanelAnchor, isRTL: boolean): string {
	const isRight = (anchor.horizontal === "end") !== isRTL;
	return `${isRight ? "100%" : "0%"} ${anchor.vertical === "bottom" ? "100%" : "50%"}`;
}

/**
 * Styling for every part of a section rail.
 *
 * **The bar's colour is two layers, not one class.** `bar` is the resting
 * track, `bg-muted-foreground/40`; `barFill` is a `bg-foreground` layer over it
 * whose opacity eases in when the bar becomes active. A colour can then ease
 * without resolving either token in JavaScript, and both stay classes a theme
 * repaints.
 *
 * **The label owns its colour** (rule 1): `itemLabel` carries the `isActive`
 * colour and weight, and `item` — the row — carries none.
 *
 * **The scrim is transparent.** It exists to catch the outside tap that closes
 * the panel, not to dim the screen: the reader is choosing where to go in the
 * page they are looking at.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const sectionRailVariants = tv({
	slots: {
		/** Fills the screen container and passes every touch it does not own through. */
		root: "absolute inset-0",
		/** Catches the outside tap while the panel is open. */
		scrim: "absolute inset-0 bg-transparent",
		/** The rail's hit area: at least 44pt wide, however short its bars. */
		trigger: "min-w-11 gap-2 py-3",
		/** One section's resting bar. */
		bar: "h-0.75 overflow-hidden rounded-full bg-muted-foreground/40",
		/** The active colour over a bar, faded in. */
		barFill: "absolute inset-0 rounded-full bg-foreground",
		/** The panel. */
		content: "rounded-lg border border-border bg-popover p-1",
		/** One row of the panel. No start padding: that is the level's indent, from `resolveItemIndent`. */
		item: "min-h-11 justify-center rounded-md py-2 pe-3",
		/** The row's title. Handed to a `Text`. */
		itemLabel: "text-sm",
	},
	variants: {
		placement: {
			end: { trigger: "items-end" },
			start: { trigger: "items-start" },
		},
		align: {
			center: {},
			bottom: {},
		},
		isActive: {
			true: { item: "bg-muted", itemLabel: "font-medium text-foreground" },
			false: { itemLabel: "text-muted-foreground" },
		},
	},
	defaultVariants: {
		align: SECTION_RAIL_DEFAULT_ALIGN,
		isActive: false,
		placement: SECTION_RAIL_DEFAULT_PLACEMENT,
	},
});

export type SectionRailVariantProps = VariantProps<typeof sectionRailVariants>;
