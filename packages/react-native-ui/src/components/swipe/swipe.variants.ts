import type { ReactElement, ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The two edges a row can slide away from. `end` is the edge text runs toward. */
export const SWIPE_SIDES = ["start", "end"] as const;

/** Badge's, Slider's and Switch's set. `default` is the neutral tile. */
export const SWIPE_ACTION_COLORS = ["default", "primary", "success", "warning", "info", "destructive"] as const;

export type SwipeSide = (typeof SWIPE_SIDES)[number];
export type SwipeOpenSide = SwipeSide | null;
export type SwipeActionColor = (typeof SWIPE_ACTION_COLORS)[number];

/**
 * One tile's width, in points. Every tile is the same width, so a panel's width
 * is a count times this and nothing has to be measured.
 *
 * The `tileContent` slot writes it out as `w-18` (18 × 4 = 72) and a test pins
 * the two together.
 */
export const SWIPE_TILE_WIDTH = 72;

/** How much of a drag toward a side with no panel the row follows. */
export const SWIPE_RUBBER_BAND = 0.2;

/** Seconds of release velocity added to the offset before it is judged. */
export const SWIPE_PROJECTION = 0.1;

/** How far past the panel, as a share of the row's width, a full swipe sits. */
export const SWIPE_FULL_FRACTION = 0.35;

/**
 * The spring a row settles on after a release or a tap.
 *
 * Damped to settle with the barest overshoot: a row that bounced past its panel
 * would flash the colour behind the outermost tile on every open.
 */
export const SWIPE_SPRING = { damping: 26, mass: 0.6, stiffness: 320 } as const;

/** What every spring becomes under reduced motion, in milliseconds. */
export const SWIPE_REDUCED_DURATION = 160;

/** How long a full swipe takes to carry the row off, in milliseconds. */
export const SWIPE_FLY_OFF_DURATION = 200;

/**
 * The markers' display names. The partition matches on these rather than on
 * function identity — Switch's `isSwitchThumbElement` records why identity is
 * not trusted alone in a package that ships raw source.
 */
export const SWIPE_START_DISPLAY_NAME = "DelacourUI.Swipe.Start";
export const SWIPE_END_DISPLAY_NAME = "DelacourUI.Swipe.End";

/** What the root reads off a lifted tile — `Swipe.Action`'s props, as far as layout and dispatch need. */
export type SwipeTileProps = { color?: SwipeActionColor; label?: string; onPress?: () => void };

export type SwipeChildren = {
	/** The tiles behind the start edge, in source order. */
	start: ReactElement<SwipeTileProps>[];
	/** The tiles behind the end edge, in source order. */
	end: ReactElement<SwipeTileProps>[];
	/** Everything that is not a panel — the row itself. */
	row: ReactNode[];
};

type ElementLike = { type: unknown; props: { children?: ReactNode } };

function isElementLike(node: unknown): node is ElementLike {
	return typeof node === "object" && node !== null && "type" in node && "props" in node;
}

function displayNameOf(node: ElementLike): string | undefined {
	const type = node.type as { displayName?: unknown } | null;
	if (typeof type !== "function" && (typeof type !== "object" || type === null)) return undefined;
	return typeof type.displayName === "string" ? type.displayName : undefined;
}

function flatten(node: ReactNode, into: ReactNode[]): void {
	if (node === null || node === undefined || typeof node === "boolean") return;
	if (Array.isArray(node)) {
		for (const child of node) flatten(child, into);
		return;
	}
	into.push(node);
}

/**
 * Splits a `Swipe`'s children into the two panels and the row.
 *
 * `Swipe.Start` and `Swipe.End` are markers: their children are lifted out and
 * the markers themselves are dropped, because only the root knows the gap the
 * tiles have to fill. Anything else is the row, in order. Order between the
 * markers and the row does not matter.
 *
 * Reads only `type.displayName` and `props.children`, so a test can hand it
 * plain objects.
 */
export function partitionSwipeChildren(children: ReactNode): SwipeChildren {
	const result: SwipeChildren = { end: [], row: [], start: [] };
	const items: ReactNode[] = [];
	flatten(children, items);

	for (const item of items) {
		if (!isElementLike(item)) {
			result.row.push(item);
			continue;
		}
		const name = displayNameOf(item);
		const side = name === SWIPE_START_DISPLAY_NAME ? "start" : name === SWIPE_END_DISPLAY_NAME ? "end" : null;
		if (side === null) {
			result.row.push(item);
			continue;
		}
		const tiles: ReactNode[] = [];
		flatten(item.props.children, tiles);
		for (const tile of tiles) if (isElementLike(tile)) result[side].push(tile as ReactElement<SwipeTileProps>);
	}

	return result;
}

/** The tile that grows into an overshoot and fires on a full swipe: the one farthest from the row. */
export function resolveOutermostIndex(side: SwipeSide, count: number): number {
	if (count <= 0) return -1;
	return side === "end" ? count - 1 : 0;
}

/**
 * Where the row sits for a raw drag, in logical points (positive reveals `start`).
 *
 * A side with no panel follows the finger at {@link SWIPE_RUBBER_BAND}, so the
 * row still answers the touch without promising an action that is not there.
 * The gesture worklet restates this.
 */
export function resolveSwipeDrag({
	raw,
	startWidth,
	endWidth,
}: {
	raw: number;
	startWidth: number;
	endWidth: number;
}): number {
	if (raw > 0 && startWidth <= 0) return raw * SWIPE_RUBBER_BAND;
	if (raw < 0 && endWidth <= 0) return raw * SWIPE_RUBBER_BAND;
	return raw;
}

export type SwipeRelease = { kind: "close" } | { kind: "open"; side: SwipeSide } | { kind: "full"; side: SwipeSide };

/**
 * What a release does.
 *
 * The offset is projected by {@link SWIPE_PROJECTION} seconds of velocity and
 * compared with half the panel on the side it lands. A projection that crosses
 * the rest position closes rather than opening the other side.
 *
 * **A full swipe needs the finger itself past the point**, and the projection
 * still beyond it — a fast flick alone never fires the outermost action,
 * because that action is routinely Delete. The haptic ticks at exactly that
 * crossing, so the person releasing knows what will happen. A row not yet
 * measured never full-swipes.
 *
 * The gesture worklet restates this.
 */
export function resolveSwipeRelease({
	offset,
	velocity,
	startWidth,
	endWidth,
	rowWidth,
	isFullSwipe,
}: {
	offset: number;
	velocity: number;
	startWidth: number;
	endWidth: number;
	rowWidth: number;
	isFullSwipe: boolean;
}): SwipeRelease {
	const projected = offset + velocity * SWIPE_PROJECTION;
	if (projected === 0) return { kind: "close" };
	if (offset !== 0 && Math.sign(projected) !== Math.sign(offset)) return { kind: "close" };

	const side: SwipeSide = projected > 0 ? "start" : "end";
	const width = side === "start" ? startWidth : endWidth;
	if (width <= 0) return { kind: "close" };

	const reach = Math.abs(offset);
	const projectedReach = Math.abs(projected);
	const fullAt = width + SWIPE_FULL_FRACTION * rowWidth;
	if (isFullSwipe && rowWidth > 0 && reach > fullAt && projectedReach > fullAt) return { kind: "full", side };

	return projectedReach > width / 2 ? { kind: "open", side } : { kind: "close" };
}

/**
 * Where one tile sits inside its panel, measured outward from the row's edge.
 *
 * Short of fully open the tiles spread in proportion to the gap, the innermost
 * pinned to the row and each overlapped by the one outside it, so they emerge
 * from under the row and are whole and edge to edge the moment the gap reaches
 * their total. Past that the others hold and the outermost grows into the
 * overshoot, so the gap is always covered exactly and never by a hole.
 *
 * `index` is source order; on `start` the first tile is the outermost. The tile
 * worklet restates this.
 */
export function resolveTileLayout({
	side,
	index,
	count,
	tileWidth,
	offset,
}: {
	side: SwipeSide;
	index: number;
	count: number;
	tileWidth: number;
	offset: number;
}): { x: number; width: number } {
	const reveal = Math.max(0, side === "start" ? offset : -offset);
	const order = side === "end" ? index : count - 1 - index;
	const total = count * tileWidth;

	if (reveal <= total) return { width: tileWidth, x: count > 0 ? (order * reveal) / count : 0 };

	const isOutermost = order === count - 1;
	return { width: isOutermost ? reveal - order * tileWidth : tileWidth, x: order * tileWidth };
}

/**
 * The physical translation for a logical offset. Right to left, `end` is the
 * left edge, so the sign flips. The worklets restate this.
 */
export function toPhysicalOffset(offset: number, isRTL: boolean): number {
	return isRTL ? -offset : offset;
}

/** The theme token a tile's glyph and label are drawn in, per colour. */
export const SWIPE_ACTION_FOREGROUND_TOKEN: Record<SwipeActionColor, string> = {
	default: "foreground",
	primary: "primary-foreground",
	success: "success-foreground",
	warning: "warning-foreground",
	info: "info-foreground",
	destructive: "destructive-foreground",
};

export function resolveSwipeActionForegroundToken(color: SwipeActionColor): string {
	return SWIPE_ACTION_FOREGROUND_TOKEN[color];
}

/**
 * Every styled part of a swipe row, in one slotted `tv()`.
 *
 * The `color` axis paints a tile, its label and a panel together — the panel
 * takes the outermost tile's colour, so an overshoot extends that action rather
 * than opening a hole. The row slot sets no background: the row and the panel
 * never overlap, so it needs none.
 */
export const swipeVariants = tv({
	slots: {
		root: "relative overflow-hidden",
		row: "w-full",
		panel: "absolute inset-y-0 overflow-hidden",
		tile: "absolute inset-y-0 overflow-hidden",
		tilePressable: "flex-1 flex-row",
		tileContent: "w-18 items-center justify-center gap-1 px-1",
		tileLabel: "text-center font-medium text-xs",
	},
	variants: {
		color: {
			default: { panel: "bg-muted", tile: "bg-muted", tileLabel: "text-foreground" },
			primary: { panel: "bg-primary", tile: "bg-primary", tileLabel: "text-primary-foreground" },
			success: { panel: "bg-success", tile: "bg-success", tileLabel: "text-success-foreground" },
			warning: { panel: "bg-warning", tile: "bg-warning", tileLabel: "text-warning-foreground" },
			info: { panel: "bg-info", tile: "bg-info", tileLabel: "text-info-foreground" },
			destructive: { panel: "bg-destructive", tile: "bg-destructive", tileLabel: "text-destructive-foreground" },
		},
		side: {
			start: { tilePressable: "justify-end" },
			end: { tilePressable: "justify-start" },
		},
	},
	defaultVariants: { color: "default", side: "end" },
});

export type SwipeVariantProps = VariantProps<typeof swipeVariants>;
