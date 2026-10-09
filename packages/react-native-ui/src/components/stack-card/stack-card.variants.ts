import { Children, type ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The four ways a card can leave the pile. */
export const STACK_CARD_DIRECTIONS = ["left", "right", "up", "down"] as const;

/**
 * How the cards behind the top one are drawn. `stack` steps each one down and
 * smaller, `fan` rotates them alternately about the bottom centre, `flat` hides
 * them so only the top card shows.
 */
export const STACK_CARD_LAYOUTS = ["stack", "fan", "flat"] as const;

/** The state colours a stamp may take — each a token declared in both themes. */
export const STACK_CARD_STAMP_COLORS = ["primary", "success", "warning", "info", "destructive"] as const;

export type StackCardDirection = (typeof STACK_CARD_DIRECTIONS)[number];
export type StackCardLayout = (typeof STACK_CARD_LAYOUTS)[number];
export type StackCardStampColor = (typeof STACK_CARD_STAMP_COLORS)[number];

/** The directions a deck allows when it names none: a horizontal yes-or-no. */
export const STACK_CARD_DEFAULT_DIRECTIONS: readonly StackCardDirection[] = ["left", "right"];

/** What a screen reader calls each direction when the caller names none. */
export const STACK_CARD_DEFAULT_DIRECTION_LABELS: Record<StackCardDirection, string> = {
	down: "Swipe down",
	left: "Swipe left",
	right: "Swipe right",
	up: "Swipe up",
};

/** The fraction of the card's size a drag must cover to throw it. */
export const STACK_CARD_DEFAULT_THRESHOLD = 0.3;

/** Degrees of tilt a card takes for every card-width it is dragged. */
export const STACK_CARD_DRAG_ROTATION = 12;

/** The tilt each stamp carries, by the direction it answers for. */
export const STACK_CARD_STAMP_ROTATION: Record<StackCardDirection, number> = {
	down: 0,
	left: 12,
	right: -12,
	up: 0,
};

/**
 * One slotted `tv()` for every part.
 *
 * `card` is a card's look — `bg-card border border-border rounded-lg`, the
 * package's card-shaped surface (see the package AGENTS.md on `--radius`) —
 * absolutely filling the pile, so every card in the deck occupies one box and a
 * transform is the only thing that tells them apart. `stamp` is placed on the
 * side it answers for: a right-hand "yes" sits top-start, where a card tilting
 * right lifts it into view. The text colour lives on `stampLabel`, never on the
 * stamp (rule 1).
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const stackCardVariants = tv({
	slots: {
		root: "gap-4",
		pile: "relative flex-1",
		card: "absolute inset-0 overflow-hidden rounded-lg border border-border bg-card",
		stamp: "absolute rounded-md border-4 px-3 py-1",
		stampLabel: "font-bold text-2xl uppercase tracking-widest",
		empty: "absolute inset-0 items-center justify-center",
		actions: "flex-row items-center justify-center gap-4",
	},
	variants: {
		color: {
			primary: { stamp: "border-primary", stampLabel: "text-primary" },
			success: { stamp: "border-success", stampLabel: "text-success" },
			warning: { stamp: "border-warning", stampLabel: "text-warning" },
			info: { stamp: "border-info", stampLabel: "text-info" },
			destructive: { stamp: "border-destructive", stampLabel: "text-destructive" },
		},
		direction: {
			right: { stamp: "top-8 left-6" },
			left: { stamp: "top-8 right-6" },
			up: { stamp: "bottom-10 self-center" },
			down: { stamp: "top-10 self-center" },
		},
	},
	defaultVariants: {
		color: "primary",
		direction: "right",
	},
});

export type StackCardVariantProps = VariantProps<typeof stackCardVariants>;

/** What `partitionStackChildren` sorts a child into. */
export type StackCardChildKind = "stamp" | "card" | "empty" | "actions";

/**
 * Sorts the root's children by part: stamps, cards in order, the empty state
 * and the actions row.
 *
 * **Anything that is not a stamp, an empty state or an actions row is a card.**
 * A caller who wraps `StackCard.Card` in a component of their own still gets a
 * card, rather than a child silently dropped because its type is not the part's.
 * The first `Empty` and the first `Actions` win; a second of either is ignored.
 *
 * `kindOf` is passed in rather than imported so this stays free of the parts it
 * looks for, and of React Native with them.
 */
export function partitionStackChildren(
	children: ReactNode,
	kindOf: (node: ReactNode) => StackCardChildKind
): { stamps: ReactNode[]; cards: ReactNode[]; empty: ReactNode | null; actions: ReactNode | null } {
	const stamps: ReactNode[] = [];
	const cards: ReactNode[] = [];
	let empty: ReactNode | null = null;
	let actions: ReactNode | null = null;

	for (const child of Children.toArray(children)) {
		const kind = kindOf(child);
		if (kind === "stamp") stamps.push(child);
		else if (kind === "empty") empty ??= child;
		else if (kind === "actions") actions ??= child;
		else cards.push(child);
	}

	return { actions, cards, empty, stamps };
}

/**
 * Where a released card goes: a direction to throw it, or `null` to spring back.
 *
 * Momentum counts — the position is projected 0.15 s along the release velocity —
 * so a flick throws from a short drag and a flick back toward the centre cancels
 * a long one. Each axis is measured as a fraction of the card's own size along
 * it, the larger fraction is the dominant axis, and that axis alone decides.
 * A direction the deck does not allow gives `null`, as does a card not yet
 * measured.
 *
 * A worklet, self-contained, so the pan's `onEnd` calls it on the UI thread.
 */
export function resolveStackRelease({
	x,
	y,
	vx,
	vy,
	width,
	height,
	threshold,
	directions,
}: {
	x: number;
	y: number;
	vx: number;
	vy: number;
	width: number;
	height: number;
	threshold: number;
	directions: readonly StackCardDirection[];
}): StackCardDirection | null {
	"worklet";
	if (width <= 0 || height <= 0) return null;
	const px = x + vx * 0.15;
	const py = y + vy * 0.15;
	const fx = Math.abs(px) / width;
	const fy = Math.abs(py) / height;
	const isHorizontal = fx >= fy;
	const fraction = isHorizontal ? fx : fy;
	if (fraction < threshold) return null;
	const direction: StackCardDirection = isHorizontal ? (px > 0 ? "right" : "left") : py > 0 ? "down" : "up";
	return directions.includes(direction) ? direction : null;
}

/**
 * The card's offset for a finger's translation.
 *
 * Toward an allowed direction it follows one to one. **Toward a disallowed one
 * it still gives a quarter**, and springs back on release: a card that does not
 * budge at all reads as frozen, where one that gives a little and returns reads
 * as "not that way".
 *
 * A worklet, self-contained, so the pan's `onUpdate` calls it on the UI thread.
 */
export function resolveDragOffset({
	translationX,
	translationY,
	directions,
}: {
	translationX: number;
	translationY: number;
	directions: readonly StackCardDirection[];
}): { x: number; y: number } {
	"worklet";
	const xDirection: StackCardDirection = translationX > 0 ? "right" : "left";
	const yDirection: StackCardDirection = translationY > 0 ? "down" : "up";
	const x = directions.includes(xDirection) ? translationX : translationX * 0.25;
	const y = directions.includes(yDirection) ? translationY : translationY * 0.25;
	return { x, y };
}

/**
 * How far the top card is toward leaving, 0 at rest and 1 at the threshold.
 *
 * The furthest axis, as a fraction of the card's size along it, clamped. The
 * cards behind interpolate on this, which is what puts the next card exactly in
 * place by the time a release can throw the top one.
 *
 * A worklet, self-contained.
 */
export function resolveDragProgress({
	x,
	y,
	width,
	height,
	threshold,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	threshold: number;
}): number {
	"worklet";
	if (width <= 0 || height <= 0 || threshold <= 0) return 0;
	const progress = Math.max(Math.abs(x) / (width * threshold), Math.abs(y) / (height * threshold));
	return Math.min(1, progress);
}

/**
 * A stamp's opacity: its progress toward its own direction, 0..1.
 *
 * Reaches 1 at the threshold, so a stamp at full strength means "let go and this
 * is the answer". A stamp stays dark while the other axis is the dominant one,
 * so a diagonal drag in a four-way deck shows one answer, not two — the same
 * rule {@link resolveStackRelease} decides by.
 *
 * A worklet, self-contained.
 */
export function resolveStampOpacity({
	x,
	y,
	width,
	height,
	direction,
	threshold = 0.3,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	direction: StackCardDirection;
	threshold?: number;
}): number {
	"worklet";
	if (width <= 0 || height <= 0 || threshold <= 0) return 0;
	const fx = x / width;
	const fy = y / height;
	const isHorizontal = direction === "left" || direction === "right";
	if (isHorizontal ? Math.abs(fy) > Math.abs(fx) : Math.abs(fx) > Math.abs(fy)) return 0;
	const along = direction === "right" ? fx : direction === "left" ? -fx : direction === "down" ? fy : -fy;
	return Math.min(1, Math.max(0, along / threshold));
}

/** A card's resting transform — rotation in degrees. */
export type StackCardTransform = { translateY: number; scale: number; rotate: number; opacity: number };

/**
 * Where a card behind the top one sits, interpolated toward the slot ahead of it.
 *
 * `position` is how far behind the top it is (0 is the top), `progress` how far
 * the top card is toward leaving. At `progress` 1 a card is exactly where the one
 * ahead of it was at 0, so when the top card goes the next one is already in
 * place and advancing moves nothing.
 *
 * - `stack`: `translateY = 8·i`, `scale = 1 − 0.04·i`.
 * - `fan`: `rotate = ±3°·i`, alternating sign, about the bottom centre.
 * - `flat`: every card behind is hidden.
 *
 * Positions `1..depth` are opaque; the one at `depth + 1` waits hidden and fades
 * in as it moves up, so the deck never pops a card into view.
 *
 * A worklet, self-contained.
 */
export function resolveBehindTransform({
	layout,
	position,
	progress,
	depth,
}: {
	layout: StackCardLayout;
	position: number;
	progress: number;
	depth: number;
}): StackCardTransform {
	"worklet";
	const t = Math.min(1, Math.max(0, progress));
	const at = (p: number): StackCardTransform => {
		if (p <= 0) return { opacity: 1, rotate: 0, scale: 1, translateY: 0 };
		const opacity = layout === "flat" || p > depth ? 0 : 1;
		if (layout === "stack") return { opacity, rotate: 0, scale: 1 - 0.04 * p, translateY: 8 * p };
		if (layout === "fan") return { opacity, rotate: (p % 2 === 1 ? 3 : -3) * p, scale: 1, translateY: 0 };
		return { opacity, rotate: 0, scale: 1, translateY: 0 };
	};
	const from = at(position);
	if (t === 0) return from;
	const to = at(position - 1);
	return {
		opacity: from.opacity + (to.opacity - from.opacity) * t,
		rotate: from.rotate + (to.rotate - from.rotate) * t,
		scale: from.scale + (to.scale - from.scale) * t,
		translateY: from.translateY + (to.translateY - from.translateY) * t,
	};
}

/**
 * Where a thrown card ends up: one and a half of its own size off in `direction`,
 * which clears the pile at any tilt.
 *
 * A worklet, self-contained — the throw, an undo's fly-in and a declined card's
 * return all start or end here.
 */
export function resolveExitOffset({
	direction,
	width,
	height,
}: {
	direction: StackCardDirection;
	width: number;
	height: number;
}): { x: number; y: number } {
	"worklet";
	if (direction === "right") return { x: width * 1.5, y: 0 };
	if (direction === "left") return { x: -width * 1.5, y: 0 };
	if (direction === "down") return { x: 0, y: height * 1.5 };
	return { x: 0, y: -height * 1.5 };
}

/**
 * The cards actually mounted, as `[from, to)`: one behind the top for undo, the
 * top, the visible depth, and one beyond it so the next card can fade in.
 *
 * A deck of 500 therefore mounts what a deck of five does.
 */
export function resolveMountedWindow({
	index,
	count,
	depth,
}: {
	index: number;
	count: number;
	depth: number;
}): [number, number] {
	const to = Math.max(0, Math.min(count, index + depth + 2));
	const from = Math.max(0, Math.min(index - 1, to));
	return [from, to];
}

/** The number of cards drawn behind the top: 2 by default, a whole number in 0..4. */
export function resolveStackDepth(depth?: number): number {
	if (depth === undefined || Number.isNaN(depth)) return 2;
	return Math.min(4, Math.max(0, Math.round(depth)));
}
