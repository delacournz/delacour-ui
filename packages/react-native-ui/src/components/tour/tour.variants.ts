import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const TOUR_SHAPES = ["rect", "circle"] as const;
export const TOUR_PLACEMENTS = ["auto", "top", "bottom"] as const;

/** The hole's outline: a rounded rectangle around the target, or a circle around its larger side. */
export type TourShape = (typeof TOUR_SHAPES)[number];
/** Which side of the hole the card sits on. `auto` is below when it fits, else above. */
export type TourPlacement = (typeof TOUR_PLACEMENTS)[number];

export const TOUR_DEFAULT_SHAPE: TourShape = "rect";
export const TOUR_DEFAULT_PLACEMENT: TourPlacement = "auto";
/** Space between the target's edge and the hole's, in points. */
export const TOUR_DEFAULT_PADDING = 8;
/** The hole's corner, in points. Clamped to half the shorter side. */
export const TOUR_DEFAULT_RADIUS = 12;

/** How long the hole takes to travel from one target to the next. */
export const TOUR_TRANSITION_MS = 280;
/** How long the card takes to fade in once it is placed. A fade, so reduce motion keeps it. */
export const TOUR_CARD_FADE_MS = 180;

/** Space between the hole and the card, and between the card and the safe area. */
export const TOUR_CARD_GAP = 12;
/** The card's minimum distance from the screen's start and end edges. */
export const TOUR_GUTTER = 16;
/** The card never grows wider than this, so a tablet reads it as a card rather than a banner. */
export const TOUR_CARD_MAX_WIDTH = 360;

/** The theme token the scrim is painted in. Declared in both themes — the suite pins it. */
export const TOUR_SCRIM_TOKEN = "overlay";

export type TourLabels = {
	next: string;
	back: string;
	skip: string;
	/** The last step's primary action. */
	finish: string;
	/** The visible position, "2 of 5". One-based. */
	progress: (current: number, total: number) => string;
	/** What a screen reader hears before the title, "Step 2 of 5". One-based. */
	announcement: (current: number, total: number) => string;
};

export const TOUR_DEFAULT_LABELS: TourLabels = {
	next: "Next",
	back: "Back",
	skip: "Skip",
	finish: "Done",
	progress: (current, total) => `${current} of ${total}`,
	announcement: (current, total) => `Step ${current} of ${total}`,
};

/** A box in points. Window coordinates unless a resolver says otherwise. */
export type TourRect = { x: number; y: number; width: number; height: number };
/** The hole: a box plus the corner its outline is drawn with. */
export type TourHoleRect = TourRect & { radius: number };
export type TourSize = { width: number; height: number };
export type TourPoint = { x: number; y: number };
export type TourInsets = { top: number; bottom: number; left: number; right: number };

/** The per-step geometry a step may override and otherwise inherits from the tour. */
export type TourStepOptions = {
	shape: TourShape;
	padding: number;
	radius: number;
	placement: TourPlacement;
};

/** Steps in `order` order. Copies; registration order is whatever order the steps mounted in. */
export function sortSteps<T extends { order: number }>(steps: readonly T[]): T[] {
	return [...steps].sort((a, b) => a.order - b.order);
}

/** Where an order sits in the sorted list of orders, or -1 when no step has it. */
export function resolveStepIndex(orders: readonly number[], order: number): number {
	return orders.indexOf(order);
}

/** The order before or after this one, or undefined off either end or for an order no step has. */
export function resolveAdjacent(
	orders: readonly number[],
	order: number,
	direction: "next" | "back"
): number | undefined {
	const index = orders.indexOf(order);
	if (index === -1) return undefined;
	return orders[direction === "next" ? index + 1 : index - 1];
}

/**
 * The step the tour shows: the requested one when a step has that order, else the lowest.
 *
 * A requested order no step carries — `defaultStep` naming a step that has not mounted, or a
 * step that unmounted — falls back rather than leaving an open tour pointing at nothing.
 */
export function resolveCurrentOrder(orders: readonly number[], step: number | undefined): number | undefined {
	if (step !== undefined && orders.includes(step)) return step;
	return orders[0];
}

/** A step's geometry: its own value where it names one, the tour's otherwise. */
export function resolveStepOptions(root: TourStepOptions, step: Partial<TourStepOptions>): TourStepOptions {
	return {
		shape: step.shape ?? root.shape,
		padding: step.padding ?? root.padding,
		radius: step.radius ?? root.radius,
		placement: step.placement ?? root.placement,
	};
}

/**
 * The hole cut around a measured target.
 *
 * `rect` grows the target by the padding on every side and keeps the radius, clamped to half the
 * shorter side so the corners never cross. `circle` is a square around the larger side, centred
 * on the target, with a radius of half that side — a pill-shaped button becomes a ring around it
 * rather than an ellipse.
 */
export function resolveHoleRect({
	target,
	padding,
	shape,
	radius,
}: {
	target: TourRect;
	padding: number;
	shape: TourShape;
	radius: number;
}): TourHoleRect {
	const inset = Math.max(0, padding);
	const width = target.width + inset * 2;
	const height = target.height + inset * 2;

	if (shape === "circle") {
		const side = Math.max(width, height);
		return {
			x: target.x + target.width / 2 - side / 2,
			y: target.y + target.height / 2 - side / 2,
			width: side,
			height: side,
			radius: side / 2,
		};
	}

	return {
		x: target.x - inset,
		y: target.y - inset,
		width,
		height,
		radius: Math.max(0, Math.min(radius, width / 2, height / 2)),
	};
}

/** A window-space box re-expressed against an overlay whose own top-left sits at `origin`. */
export function resolveRelativeRect(rect: TourRect, origin: TourPoint): TourRect {
	return { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height };
}

/**
 * The safe-area insets as they fall on an overlay that may not cover the whole window.
 *
 * An interactive tour draws inside its own root, which can sit below a navigation bar and above a
 * tab bar: the status-bar inset is already outside it, and subtracting it again would push the
 * card a status bar's height too far down. Each edge keeps only the part of the inset it overlaps.
 */
export function resolveOverlayInsets({
	insets,
	origin,
	size,
	window,
}: {
	insets: TourInsets;
	origin: TourPoint;
	size: TourSize;
	window: TourSize;
}): TourInsets {
	return {
		top: Math.max(0, insets.top - origin.y),
		bottom: Math.max(0, insets.bottom - (window.height - (origin.y + size.height))),
		left: Math.max(0, insets.left - origin.x),
		right: Math.max(0, insets.right - (window.width - (origin.x + size.width))),
	};
}

/** Two decimals: an animating hole is redrawn every frame, and the path string is the cost. */
function round(value: number): number {
	"worklet";
	return Math.round(value * 100) / 100;
}

/**
 * The scrim as one SVG path: the whole window, then the hole, drawn with `fillRule="evenodd"`
 * so the hole is subtracted.
 *
 * The hole is always the four-arc rounded rectangle; a circle is the case where the radius is
 * half the side and the straight runs have zero length. One shape means the hole can travel from
 * a rectangle to a circle without the path changing its command list, so nothing pops mid-way.
 * A worklet — it runs inside `useAnimatedProps` every frame of a transition.
 */
export function buildMaskPath(window: TourSize, hole: TourHoleRect): string {
	"worklet";
	const w = round(window.width);
	const h = round(window.height);
	const x = round(hole.x);
	const y = round(hole.y);
	const right = round(hole.x + hole.width);
	const bottom = round(hole.y + hole.height);
	const r = round(Math.max(0, Math.min(hole.radius, hole.width / 2, hole.height / 2)));
	const arc = `A${r} ${r} 0 0 1`;

	return (
		`M0 0H${w}V${h}H0Z` +
		`M${round(x + r)} ${y}H${round(right - r)}${arc} ${right} ${round(y + r)}` +
		`V${round(bottom - r)}${arc} ${round(right - r)} ${bottom}` +
		`H${round(x + r)}${arc} ${x} ${round(bottom - r)}` +
		`V${round(y + r)}${arc} ${round(x + r)} ${y}Z`
	);
}

/**
 * The four rectangles that tile the window around the hole — top, bottom, start, end.
 *
 * An interactive tour lays these out as touch-catchers, so a touch inside the hole meets nothing
 * and reaches the control beneath. The hole is clamped to the window first, so a target half off
 * screen never yields a negative size. Square-cornered: the sliver of a rounded hole's corner
 * outside the curve still catches, which is a few points nobody aims at. A worklet.
 */
export function resolveScrimRects(window: TourSize, hole: TourRect): [TourRect, TourRect, TourRect, TourRect] {
	"worklet";
	const left = Math.min(window.width, Math.max(0, hole.x));
	const top = Math.min(window.height, Math.max(0, hole.y));
	const right = Math.min(window.width, Math.max(left, hole.x + hole.width));
	const bottom = Math.min(window.height, Math.max(top, hole.y + hole.height));
	const band = bottom - top;

	return [
		{ x: 0, y: 0, width: window.width, height: top },
		{ x: 0, y: bottom, width: window.width, height: window.height - bottom },
		{ x: 0, y: top, width: left, height: band },
		{ x: right, y: top, width: window.width - right, height: band },
	];
}

export type TourCardPlacement = {
	side: "top" | "bottom";
	top: number;
	left: number;
	width: number;
};

/** The side a card goes on when at least one side fits: the preferred one if it does, else the other. */
function resolveFittingSide(
	preference: TourPlacement,
	fitsAbove: boolean,
	fitsBelow: boolean
): TourCardPlacement["side"] {
	if (preference === "top") return fitsAbove ? "top" : "bottom";
	if (preference === "bottom") return fitsBelow ? "bottom" : "top";
	return fitsBelow ? "bottom" : "top";
}

/**
 * Where the card goes.
 *
 * **Vertically**, `auto` puts it below the hole when it fits inside the safe area, else above.
 * An explicit `top` or `bottom` is honoured when it fits and flips when only the other side does
 * — a forced side that runs the card off screen helps nobody. When neither fits (a hole taller
 * than the screen can spare) the roomier side wins and the card is clamped into the safe area,
 * overlapping the hole rather than the status bar.
 *
 * **Horizontally** it is centred on the hole and clamped between the gutters, which clear the
 * side insets in landscape. Its width is the window less both gutters, capped at `maxWidth`.
 */
export function resolveCardPlacement({
	hole,
	cardHeight,
	window,
	insets,
	gap,
	gutter,
	maxWidth,
	preference,
}: {
	hole: TourRect;
	cardHeight: number;
	window: TourSize;
	insets: TourInsets;
	gap: number;
	gutter: number;
	maxWidth: number;
	preference: TourPlacement;
}): TourCardPlacement {
	const minTop = insets.top + gap;
	const maxBottom = window.height - insets.bottom - gap;

	const belowTop = hole.y + hole.height + gap;
	const aboveTop = hole.y - gap - cardHeight;
	const fitsBelow = belowTop + cardHeight <= maxBottom;
	const fitsAbove = aboveTop >= minTop;

	const side =
		fitsAbove || fitsBelow
			? resolveFittingSide(preference, fitsAbove, fitsBelow)
			: hole.y - gap - minTop >= maxBottom - belowTop
				? "top"
				: "bottom";

	const rawTop = side === "bottom" ? belowTop : aboveTop;
	const top = Math.max(minTop, Math.min(rawTop, maxBottom - cardHeight));

	const minLeft = insets.left + gutter;
	const maxRight = window.width - insets.right - gutter;
	const width = Math.max(0, Math.min(maxWidth, maxRight - minLeft));
	const centred = hole.x + hole.width / 2 - width / 2;
	const left = Math.max(minLeft, Math.min(centred, maxRight - width));

	return { side, top, left, width };
}

/** The tour's labels: the caller's where given, English otherwise. */
export function resolveTourLabels(labels: Partial<TourLabels> | undefined): TourLabels {
	return { ...TOUR_DEFAULT_LABELS, ...labels };
}

/** The visible position, "2 of 5". `current` is one-based. */
export function resolveTourProgressLabel(current: number, total: number, labels: TourLabels): string {
	return labels.progress(current, total);
}

/** A sentence ends in punctuation; one that does not gets a full stop. */
function sentence(text: string): string {
	const trimmed = text.trim();
	return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * What VoiceOver and TalkBack read when a step's card takes focus: position, title, description.
 * "Step 2 of 5. Search. Find anything in your library."
 */
export function resolveTourAnnouncement({
	current,
	total,
	title,
	description,
	labels,
}: {
	current: number;
	total: number;
	title: string;
	description?: string;
	labels: TourLabels;
}): string {
	const parts = [sentence(labels.announcement(current, total)), sentence(title)];
	if (description) parts.push(sentence(description));
	return parts.join(" ");
}

export type TourFooter = {
	/** Back is hidden on the first step — there is nowhere to go. */
	hasBack: boolean;
	/** Skip is hidden on the last step, where Done already ends the tour. */
	hasSkip: boolean;
	/** The primary action is Done rather than Next. */
	isLast: boolean;
};

/** Which footer actions a step shows. `index` is zero-based. */
export function resolveTourFooter({
	index,
	total,
	hasSkip,
}: {
	index: number;
	total: number;
	hasSkip: boolean;
}): TourFooter {
	const isLast = index >= total - 1;
	return { hasBack: index > 0, hasSkip: hasSkip && !isLast, isLast };
}

/** The `testID`s the card's parts carry, each unset when the tour has none. */
export type TourTestIDs = {
	card: string | undefined;
	next: string | undefined;
	back: string | undefined;
	skip: string | undefined;
};

/**
 * The card's `testID`s, derived from the tour's own.
 *
 * The card is drawn by the tour, so a caller cannot reach its actions to tag them — and a test or
 * a capture flow has to press Next. One root `testID` names all four rather than a prop per action.
 */
export function resolveTourTestIDs(testID: string | undefined): TourTestIDs {
	const derive = (part: string): string | undefined => (testID === undefined ? undefined : `${testID}-${part}`);
	return { card: derive("card"), next: derive("next"), back: derive("back"), skip: derive("skip") };
}

/**
 * How long the hole takes to reach a new target. Zero jumps.
 *
 * Reduce motion jumps — the hole is travel, which is what the setting asks to remove. So does the
 * first hole of an opening: there is no previous target, and travelling in from a zero rect would
 * draw the hole growing out of the top-left corner.
 */
export function resolveTourTransitionDuration({
	isReducedMotion,
	isFirst,
}: {
	isReducedMotion: boolean;
	isFirst: boolean;
}): number {
	return isReducedMotion || isFirst ? 0 : TOUR_TRANSITION_MS;
}

/**
 * The tour's slots.
 *
 * `card` is the surface the house card uses — `bg-card`, the card corner, a hairline — but
 * absolutely positioned, because the card's place is computed from the hole and handed over as a
 * style rather than laid out. `title` and `description` carry their own colour (rule 1).
 */
export const tourVariants = tv({
	slots: {
		root: "flex-1",
		scrim: "absolute inset-0",
		card: "absolute gap-3 rounded-lg border border-border bg-card p-4",
		header: "gap-1",
		title: "text-card-foreground",
		description: "text-muted-foreground",
		footer: "flex-row flex-wrap items-center justify-end gap-2",
		progress: "text-muted-foreground",
	},
});

export type TourVariantProps = VariantProps<typeof tourVariants>;
