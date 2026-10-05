/**
 * Where an anchored panel goes — pure, so the whole matrix is reachable from
 * `bun test`.
 *
 * **A leaf.** Popover, Tooltip and, later, Menu and Select all import this
 * file, so it imports nothing at all: never `./popover`, never `./index`.
 */

/** The side of the anchor the panel prefers. A preference: it flips when that side lacks room. */
export type PopoverPlacement = "top" | "bottom" | "left" | "right";

/** Which edges line up along the cross axis. Logical on `top` / `bottom`: mirrored under RTL. */
export type PopoverAlign = "start" | "center" | "end";

/** A fixed width, the anchor's width, the content's own, or the safe span. */
export type PopoverWidth = number | "trigger" | "content-fit" | "full";

/** A view's frame in window coordinates — what `measureInWindow` reports. */
export type AnchorRect = { x: number; y: number; width: number; height: number };

export type AnchoredSize = { width: number; height: number };

export type AnchoredInsets = { top: number; right: number; bottom: number; left: number };

export type AnchoredBounds = { width: number; height: number; insets: AnchoredInsets };

export type AnchoredInput = {
	anchor: AnchorRect;
	content: AnchoredSize;
	bounds: AnchoredBounds;
	placement: PopoverPlacement;
	align: PopoverAlign;
	/** The gap between anchor and panel along the main axis. */
	offset: number;
	/** A nudge along the cross axis, inward from the aligned edge. */
	alignOffset: number;
	/** Keep this far from the bounds' safe edges. */
	collisionPadding: number;
	/** The panel's corner radius plus the arrow's half-diagonal; the arrow never sits inside it. */
	arrowInset: number;
	/** The caller's cap on the panel's height, before the room on the resolved side clamps it. */
	maxHeight?: number;
	/** Align start / end are logical on top / bottom placements. */
	isRTL: boolean;
};

export type AnchoredPosition = {
	/** The panel's left edge, in window coordinates. */
	x: number;
	/** The panel's top edge, in window coordinates. */
	y: number;
	/** The side it ended up on, after any flip. */
	placement: PopoverPlacement;
	/** `min(maxHeight, room)` — the room on the resolved side for top / bottom, the safe height for left / right. */
	maxHeight: number;
	/** Distance along the panel's facing edge to the arrow's centre — toward the anchor's centre, clamped clear of the corners. */
	arrowOffset: number;
};

type SafeRect = { left: number; top: number; right: number; bottom: number };

const OPPOSITE: Record<PopoverPlacement, PopoverPlacement> = {
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left",
};

function isVertical(placement: PopoverPlacement): boolean {
	return placement === "top" || placement === "bottom";
}

function safeRect(bounds: AnchoredBounds, padding: number): SafeRect {
	return {
		left: bounds.insets.left + padding,
		top: bounds.insets.top + padding,
		right: bounds.width - bounds.insets.right - padding,
		bottom: bounds.height - bounds.insets.bottom - padding,
	};
}

/** The space between the anchor (plus offset) and the safe edge on `placement`'s side. */
function roomOn(placement: PopoverPlacement, anchor: AnchorRect, offset: number, safe: SafeRect): number {
	switch (placement) {
		case "bottom":
			return safe.bottom - (anchor.y + anchor.height + offset);
		case "top":
			return anchor.y - offset - safe.top;
		case "right":
			return safe.right - (anchor.x + anchor.width + offset);
		case "left":
			return anchor.x - offset - safe.left;
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * The cross-axis start of a panel of `size` along an anchor spanning
 * `[start, start + length]`, before any shift.
 *
 * `start` lines up leading edges, `end` trailing edges. `alignOffset` moves the
 * panel inward from whichever edge it is aligned to, and `direction` is −1 on
 * the horizontal axis under RTL, which is what makes start / end logical.
 */
function alignAlong(
	start: number,
	length: number,
	size: number,
	align: PopoverAlign,
	alignOffset: number,
	direction: 1 | -1
): number {
	const leading = direction === 1 ? start : start + length - size;
	const trailing = direction === 1 ? start + length - size : start;
	switch (align) {
		case "start":
			return leading + alignOffset * direction;
		case "end":
			return trailing - alignOffset * direction;
		case "center":
			return start + (length - size) / 2 + alignOffset * direction;
	}
}

/**
 * Places a panel of `content` size against `anchor`.
 *
 * 1. Prefer `placement`. Flip to the opposite side **only** when the preferred
 *    side cannot hold the panel and the opposite has more room — a panel that
 *    fits nowhere stays where it was asked to be unless moving buys room.
 * 2. `maxHeight` is `min(maxHeight, room)`: the room on the resolved side for
 *    a top / bottom panel, the safe height for a side one. A panel taller than
 *    that is clamped, which is what keeps it on screen.
 * 3. Align along the cross axis, then shift to stay inside
 *    `bounds − insets − collisionPadding`. Finally clamp both axes, so the
 *    panel is never off-screen whatever the anchor did.
 * 4. The arrow points at the anchor's centre, clamped to
 *    `[arrowInset, size − arrowInset]` — the middle when the panel is too small
 *    to clear both corners.
 */
export function resolveAnchoredPosition(input: AnchoredInput): AnchoredPosition {
	const { anchor, content, bounds, align, offset, alignOffset, collisionPadding, arrowInset, isRTL } = input;
	const safe = safeRect(bounds, collisionPadding);
	const cap = input.maxHeight ?? Number.POSITIVE_INFINITY;

	const preferred = input.placement;
	const opposite = OPPOSITE[preferred];
	const needed = (placement: PopoverPlacement): number =>
		isVertical(placement) ? Math.min(content.height, cap) : content.width;
	const preferredRoom = roomOn(preferred, anchor, offset, safe);
	const oppositeRoom = roomOn(opposite, anchor, offset, safe);
	const placement = preferredRoom < needed(preferred) && oppositeRoom > preferredRoom ? opposite : preferred;

	const room = isVertical(placement) ? roomOn(placement, anchor, offset, safe) : safe.bottom - safe.top;
	const maxHeight = Math.max(0, Math.min(cap, room));
	const width = content.width;
	const height = Math.min(content.height, maxHeight);

	let x: number;
	let y: number;
	if (isVertical(placement)) {
		y = placement === "bottom" ? anchor.y + anchor.height + offset : anchor.y - offset - height;
		x = alignAlong(anchor.x, anchor.width, width, align, alignOffset, isRTL ? -1 : 1);
	} else {
		x = placement === "right" ? anchor.x + anchor.width + offset : anchor.x - offset - width;
		y = alignAlong(anchor.y, anchor.height, height, align, alignOffset, 1);
	}

	x = clamp(x, safe.left, safe.right - width);
	y = clamp(y, safe.top, safe.bottom - height);

	const edge = isVertical(placement) ? width : height;
	const toCentre = isVertical(placement) ? anchor.x + anchor.width / 2 - x : anchor.y + anchor.height / 2 - y;
	const arrowOffset = edge < arrowInset * 2 ? edge / 2 : clamp(toCentre, arrowInset, edge - arrowInset);

	return { x, y, placement, maxHeight, arrowOffset };
}

export type PopoverWidthInput = {
	width: PopoverWidth;
	anchorWidth: number;
	bounds: AnchoredBounds;
	collisionPadding: number;
	minWidth?: number;
};

export type ResolvedPopoverWidth = {
	/** A fixed width, or `undefined` to let the content size itself. */
	width?: number;
	/** Only for a content-fit panel; a fixed width has already been raised to it. */
	minWidth?: number;
	/** The safe span — no panel is ever wider than the screen it is on. */
	maxWidth: number;
};

/**
 * Resolves `width` to numbers before the panel is measured.
 *
 * `"trigger"` is the anchor's width, which is what a form field under its
 * trigger wants; `"full"` is the safe span; a number is taken as given. Each is
 * raised to `minWidth` and capped at the safe span. `"content-fit"` leaves the
 * width to the content and passes `minWidth` through as a floor.
 */
export function resolvePopoverWidth({
	width,
	anchorWidth,
	bounds,
	collisionPadding,
	minWidth,
}: PopoverWidthInput): ResolvedPopoverWidth {
	const maxWidth = Math.max(0, bounds.width - bounds.insets.left - bounds.insets.right - collisionPadding * 2);
	if (width === "content-fit") {
		return minWidth === undefined ? { maxWidth } : { minWidth: Math.min(minWidth, maxWidth), maxWidth };
	}
	const base = width === "trigger" ? anchorWidth : width === "full" ? maxWidth : width;
	return { width: Math.min(Math.max(base, minWidth ?? 0), maxWidth), maxWidth };
}

/**
 * Where the panel starts its entrance, relative to where it settles: `distance`
 * back toward the anchor, so a panel below the trigger enters downward from it.
 */
export function resolveEnterTranslate(placement: PopoverPlacement, distance: number): { x: number; y: number } {
	switch (placement) {
		case "bottom":
			return { x: 0, y: -distance };
		case "top":
			return { x: 0, y: distance };
		case "right":
			return { x: -distance, y: 0 };
		case "left":
			return { x: distance, y: 0 };
	}
}

/**
 * The scale's origin, in the panel's own coordinates: the arrow, on the edge
 * facing the anchor — so the panel grows out of the thing that opened it.
 */
export function resolveTransformOrigin(
	placement: PopoverPlacement,
	arrowOffset: number,
	size: AnchoredSize
): { x: number; y: number } {
	switch (placement) {
		case "bottom":
			return { x: arrowOffset, y: 0 };
		case "top":
			return { x: arrowOffset, y: size.height };
		case "right":
			return { x: 0, y: arrowOffset };
		case "left":
			return { x: size.width, y: arrowOffset };
	}
}

/**
 * Where the arrow's square sits inside the panel, and how far it is turned.
 *
 * Centred on the facing edge at `arrowOffset`, so half of it shows past the
 * panel. The square carries its border on the bottom and right edges only, and
 * at 45° the corner between those two points straight down: each placement
 * turns that corner toward the anchor, so the bordered edges are the outer two
 * and the bare two are the ones that lie over the panel.
 */
export function resolveArrowFrame(
	placement: PopoverPlacement,
	arrowOffset: number,
	size: AnchoredSize,
	arrowSize: number
): { left: number; top: number; rotate: number } {
	const half = arrowSize / 2;
	switch (placement) {
		case "bottom":
			return { left: arrowOffset - half, top: -half, rotate: 225 };
		case "top":
			return { left: arrowOffset - half, top: size.height - half, rotate: 45 };
		case "right":
			return { left: -half, top: arrowOffset - half, rotate: 135 };
		case "left":
			return { left: size.width - half, top: arrowOffset - half, rotate: 315 };
	}
}
