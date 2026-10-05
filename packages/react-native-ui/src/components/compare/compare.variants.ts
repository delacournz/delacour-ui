import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { IconSize } from "../icon/icon.variants";

/** Which way the seam travels. `vertical` puts Before on top and needs a definite height. */
export const COMPARE_ORIENTATIONS = ["horizontal", "vertical"] as const;

/** The handle's size. The frame has none of its own — its `className` gives it one. */
export const COMPARE_SIZES = ["sm", "md", "lg"] as const;

/** What the handle and divider are painted in. Slider's set, reusing tokens the theme already has. */
export const COMPARE_COLORS = ["default", "primary", "success", "warning", "destructive", "info"] as const;

export type CompareOrientation = (typeof COMPARE_ORIENTATIONS)[number];
export type CompareSize = (typeof COMPARE_SIZES)[number];
export type CompareColor = (typeof COMPARE_COLORS)[number];

/** Where a drag may begin: on the handle's band only, or anywhere on the frame. */
export type CompareGrab = "handle" | "anywhere";

/** A side of the comparison. Before is always on the leading side. */
export type CompareSide = "before" | "after";

/** Where a label sits along the cross axis. */
export type CompareLabelPlacement = "start" | "end";

/**
 * 0–1: the fraction of the frame the Before layer covers, from the leading edge.
 * `0` shows only After, `1` only Before.
 */
export type ComparePosition = number;

export const COMPARE_DEFAULT_POSITION: ComparePosition = 0.5;
export const COMPARE_DEFAULT_ORIENTATION: CompareOrientation = "horizontal";
export const COMPARE_DEFAULT_COLOR: CompareColor = "default";
export const COMPARE_DEFAULT_SIZE: CompareSize = "md";
export const COMPARE_DEFAULT_GRAB: CompareGrab = "handle";

/** How close, in position units, a release must land to a snap point to be pulled onto it. */
export const COMPARE_SNAP_THRESHOLD = 0.04;

/** What one assistive increment moves the seam by. */
export const COMPARE_STEP = 0.1;

/**
 * The handle's touch band along the drag axis, in points.
 *
 * The capsule's short side plus the band's padding, and a test asserts the sum at
 * every size. The band is what the pan tests a touch against in `grab="handle"`.
 */
export const COMPARE_HANDLE_BAND = 44;

/** The release spring. Firm enough that a snap reads as a decision, soft enough to show the velocity. */
export const COMPARE_HANDLE_SPRING = { damping: 20, stiffness: 220, mass: 0.6 } as const;

/** The capsule grows on grab — the handle is lifted, not pressed. */
export const COMPARE_GRAB_SCALE = { rest: 1, grabbed: 1.08 } as const;

/**
 * Half-width of the zone around a snap point inside which no further tick fires.
 *
 * A finger resting on a point jitters across it every frame; without the band
 * that is a buzz. Arriving in the band ticks once, moving within it ticks never.
 */
export const COMPARE_HAPTIC_DEAD_BAND = 0.01;

/** How much of the frame a label's side must be covered by before it has faded fully out. */
export const COMPARE_LABEL_FADE = 0.15;

/** `grab="anywhere"`: points along the axis before the seam claims the drag. */
export const COMPARE_ANYWHERE_ACTIVE_OFFSET = 8;

/** `grab="anywhere"`: points across the axis before the seam gives the drag up to a scroll. */
export const COMPARE_ANYWHERE_FAIL_OFFSET = 12;

/** The grip glyph's step on the icon scale, per handle size. */
export const COMPARE_GRIP_ICON_SIZE: Record<CompareSize, IconSize> = { sm: "xs", md: "sm", lg: "md" };

/**
 * The glyph colour per handle colour — always the capsule token's `-foreground`,
 * which is what the token means (rule 11). `default` paints the capsule in
 * `foreground`, whose content colour is `background`.
 */
const COMPARE_GLYPH_COLOR: Record<CompareColor, string> = {
	default: "background",
	primary: "primary-foreground",
	success: "success-foreground",
	warning: "warning-foreground",
	destructive: "destructive-foreground",
	info: "info-foreground",
};

/**
 * Styling for every part of a comparison.
 *
 * One slotted `tv()` because `compare-before.tsx`, `compare-handle.tsx` and
 * `compare-label.tsx` cannot import the root without closing a cycle (AGENTS.md
 * rule 3), and all of them read the same axes.
 *
 * **The layers stack by `z-*`, not by child order.** After is `z-0`, Before's
 * mask `z-10`, the handle `z-20` and the labels `z-30`, so a caller writing
 * `<Compare.After>` first still sees Before on top.
 *
 * **The handle is a band, a divider and a capsule.** The band is a transparent
 * strip the full height of the frame (width when vertical) and 44pt across the
 * drag axis — the capsule's short side plus padding, in the same compound cell so
 * a retune of one cannot shrink the other. The divider is absolutely placed and
 * centred by the band's `items-center`; it is 4pt with a 1pt `border-background`
 * hairline on each long edge, which leaves a 2pt rule in the colour and keeps it
 * visible over bright and dark imagery alike. Nothing casts a shadow.
 *
 * **The capsule takes the colour and the glyph its `-foreground`**, the pairing
 * Slider's thumb uses. `default` and `primary` name different tokens this theme
 * tunes alike; an app that re-themes `primary` wants `default` left as ink.
 *
 * **The fade for `isDisabled` lands on the handle**, which carries no animated
 * opacity — the unmeasured-frame fade lives on its inner capsule's parent style,
 * not this class.
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const compareVariants = tv({
	slots: {
		/** The frame. No intrinsic size — the caller's `className` supplies `aspect-*` or `h-*`. */
		root: "relative w-full overflow-hidden rounded-lg",
		/** After: the full-frame back layer. */
		layer: "absolute inset-0 z-0",
		/** Before's clip. Translated along the axis; never resized. */
		mask: "absolute inset-0 z-10 overflow-hidden",
		/** Before's content, counter-translated so it stays in register with After. */
		inner: "absolute inset-0",
		/** The transparent touch band the divider and capsule sit in. */
		handle: "absolute z-20 items-center justify-center",
		/** The rule in the handle's colour, edged by background hairlines. */
		divider: "absolute border-background",
		/** The grip. Painted in the colour; the glyph inside takes its foreground. */
		capsule: "items-center justify-center rounded-full",
		/** A caption pinned to one side. */
		label: "absolute z-30 rounded-full bg-background px-2 py-0.5",
	},
	variants: {
		orientation: {
			horizontal: {
				handle: "top-0 bottom-0 left-0 flex-col",
				divider: "top-0 bottom-0 w-1 border-x",
			},
			vertical: {
				handle: "top-0 right-0 left-0 flex-row",
				divider: "right-0 left-0 h-1 border-y",
			},
		},
		// Empty because the capsule's two axes differ and only the orientation
		// knows which is which — the six cells below carry both.
		size: { sm: {}, md: {}, lg: {} },
		color: {
			default: { divider: "bg-foreground", capsule: "bg-foreground" },
			primary: { divider: "bg-primary", capsule: "bg-primary" },
			success: { divider: "bg-success", capsule: "bg-success" },
			warning: { divider: "bg-warning", capsule: "bg-warning" },
			destructive: { divider: "bg-destructive", capsule: "bg-destructive" },
			info: { divider: "bg-info", capsule: "bg-info" },
		},
		isDisabled: { true: { handle: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		// The capsule's short side and the band's padding are one number: they sum
		// to 44pt at every size. Six cells rather than a second scale, so the two
		// orientations cannot drift to different weights.
		{ orientation: "horizontal", size: "sm", class: { handle: "px-3", capsule: "h-7 w-5" } },
		{ orientation: "horizontal", size: "md", class: { handle: "px-2.5", capsule: "h-9 w-6" } },
		{ orientation: "horizontal", size: "lg", class: { handle: "px-2", capsule: "h-11 w-7" } },
		{ orientation: "vertical", size: "sm", class: { handle: "py-3", capsule: "h-5 w-7" } },
		{ orientation: "vertical", size: "md", class: { handle: "py-2.5", capsule: "h-6 w-9" } },
		{ orientation: "vertical", size: "lg", class: { handle: "py-2", capsule: "h-7 w-11" } },
	],
	defaultVariants: {
		color: COMPARE_DEFAULT_COLOR,
		size: COMPARE_DEFAULT_SIZE,
		orientation: COMPARE_DEFAULT_ORIENTATION,
		isDisabled: false,
	},
});

export type CompareVariantProps = VariantProps<typeof compareVariants>;

/** The handle's three class strings and its glyph colour token, for one set of axes. */
export function resolveCompareHandleClasses({
	color,
	size,
	orientation,
	isDisabled = false,
}: {
	color: CompareColor;
	size: CompareSize;
	orientation: CompareOrientation;
	isDisabled?: boolean;
}): { handle: string; divider: string; capsule: string; glyphColor: string } {
	const slots = compareVariants({ color, size, orientation, isDisabled });
	return {
		handle: slots.handle(),
		divider: slots.divider(),
		capsule: slots.capsule(),
		glyphColor: COMPARE_GLYPH_COLOR[color],
	};
}

/**
 * Clamps a position to `[min, max]`.
 *
 * `NaN` becomes `min`: a `NaN` written to a shared value freezes every transform
 * that reads it, for good.
 */
export function clampPosition(position: number, min = 0, max = 1): number {
	"worklet";
	if (Number.isNaN(position)) return min;
	return position < min ? min : position > max ? max : position;
}

/**
 * The position a touch at `along` points along the axis represents.
 *
 * Horizontal reads from the left, vertical from the top. Under RTL Before sits on
 * the right, so a horizontal reading is mirrored. An unmeasured frame reads `0`.
 */
export function resolvePositionFromGesture({
	along,
	size,
	orientation,
	isRtl,
}: {
	along: number;
	size: number;
	orientation: CompareOrientation;
	isRtl: boolean;
}): number {
	"worklet";
	if (!(size > 0)) return 0;
	const raw = along / size;
	const ratio = raw < 0 ? 0 : raw > 1 ? 1 : raw;
	return orientation === "horizontal" && isRtl ? 1 - ratio : ratio;
}

/** Below this, two distances are the same distance — float noise, not intent. */
const EPSILON = 1e-9;

/**
 * The snap point a release lands on, or the position unchanged.
 *
 * A point within `threshold` (inclusive) pulls the seam onto it; the nearest
 * wins, and a tie goes to the lower point.
 */
export function snapPosition(position: number, snapPoints: readonly number[], threshold: number): number {
	"worklet";
	let best = position;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const point of snapPoints) {
		const distance = Math.abs(point - position);
		if (distance > threshold + EPSILON) continue;
		if (distance < bestDistance - EPSILON || (Math.abs(distance - bestDistance) <= EPSILON && point < best)) {
			best = point;
			bestDistance = distance;
		}
	}
	return best;
}

/**
 * One assistive step in `direction`, clamped to the bounds.
 *
 * Rounded to six places so ten steps of a tenth land on exactly `1` rather than
 * `0.9999999999999999`, which would never read "Showing only before".
 */
export function stepPosition(
	position: number,
	direction: 1 | -1,
	step: number,
	bounds: { min: number; max: number }
): number {
	const next = Math.round((position + direction * step) * 1e6) / 1e6;
	return next < bounds.min ? bounds.min : next > bounds.max ? bounds.max : next;
}

/**
 * The three translations that draw a position: the Before mask, its content, and
 * the handle.
 *
 * The mask slides `-(1 - p) × size` along the axis and its content slides back
 * by exactly as much, so the content never moves relative to the frame — it is
 * revealed, not squashed. `handleOffset` is the seam's physical distance from the
 * left (top when vertical); under RTL Before sits on the right, so the x offsets
 * negate and the seam is measured from the other edge. An unmeasured frame
 * returns zeros.
 */
export function resolveRevealTransforms(
	position: number,
	size: number,
	orientation: CompareOrientation,
	isRtl: boolean
): { maskOffset: number; innerOffset: number; handleOffset: number } {
	"worklet";
	if (!(size > 0)) return { maskOffset: 0, innerOffset: 0, handleOffset: 0 };
	const covered = (1 - position) * size;
	const mirrored = orientation === "horizontal" && isRtl;
	const maskOffset = mirrored ? covered : -covered;
	return {
		maskOffset: maskOffset === 0 ? 0 : maskOffset,
		innerOffset: maskOffset === 0 ? 0 : -maskOffset,
		handleOffset: mirrored ? size - position * size : position * size,
	};
}

/** Whether a touch at `along` lands on the handle's band centred at `seamAlong`. Edge inclusive. */
export function isWithinGrabBand(along: number, seamAlong: number, band: number): boolean {
	"worklet";
	return Math.abs(along - seamAlong) <= band / 2;
}

/**
 * Whether a move from `prev` to `next` earns a haptic tick.
 *
 * It ticks on **arriving** at a snap point — entering the dead band around it
 * from outside, or leaping clean across it in one frame — and on reaching either
 * bound. Moving within the band, or leaving it, or leaving a bound, is silent: a
 * finger resting on a point is not a cadence.
 */
export function shouldTickCompareHaptic(
	prev: number,
	next: number,
	snapPoints: readonly number[],
	min: number,
	max: number
): boolean {
	"worklet";
	if (prev === next) return false;
	if ((next >= max && prev < max) || (next <= min && prev > min)) return true;
	const band = COMPARE_HAPTIC_DEAD_BAND;
	for (const point of snapPoints) {
		const wasInside = Math.abs(prev - point) <= band;
		if (wasInside) continue;
		const isInside = Math.abs(next - point) <= band;
		const leapt = (prev < point && next > point) || (prev > point && next < point);
		if (isInside || leapt) return true;
	}
	return false;
}

/**
 * What a screen reader says for a position: the Before layer's share, since that
 * is the number the seam draws — "50 percent before" — or, at either end, the one
 * layer on show. `labels` substitutes the caller's names for the two sides.
 */
export function resolveCompareValueText(position: number, labels?: { before?: string; after?: string }): string {
	const before = labels?.before ?? "before";
	const after = labels?.after ?? "after";
	const percent = Math.round(position * 100);
	if (percent <= 0) return `Showing only ${after}`;
	if (percent >= 100) return `Showing only ${before}`;
	return `${percent} percent ${before}`;
}

/**
 * The layer with nothing on show, which must leave the accessibility tree — a
 * covered layer is otherwise focusable while invisible.
 */
export function resolveCoveredLayer(position: number): CompareSide | null {
	if (position <= 0) return "before";
	if (position >= 1) return "after";
	return null;
}

/**
 * A position, rounded to the percent React is told about during a drag.
 *
 * The seam itself moves at full precision on the UI thread; the mirror to React
 * state only crosses when this changes, so a whole-frame drag is a hundred
 * commits at most rather than one per frame.
 */
export function quantizePosition(position: number): number {
	"worklet";
	return Math.round(position * 100) / 100;
}

/**
 * A side's label opacity: full while its side is uncovered, fading to nothing over
 * the last {@link COMPARE_LABEL_FADE} of the frame as the seam covers it.
 */
export function resolveCompareLabelOpacity(side: CompareSide, position: number): number {
	"worklet";
	const shown = side === "before" ? position : 1 - position;
	const ratio = shown / COMPARE_LABEL_FADE;
	return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

/**
 * Where a label sits, as physical inset classes written out in full so
 * Tailwind's scanner sees every one.
 *
 * The first class is the side's edge along the axis — Before's leading edge,
 * After's trailing one, mirrored horizontally under RTL — and the second is the
 * placement across it.
 */
const LABEL_EDGE: Record<CompareOrientation, Record<"leading" | "trailing", Record<"ltr" | "rtl", string>>> = {
	horizontal: {
		leading: { ltr: "left-3", rtl: "right-3" },
		trailing: { ltr: "right-3", rtl: "left-3" },
	},
	vertical: {
		leading: { ltr: "top-3", rtl: "top-3" },
		trailing: { ltr: "bottom-3", rtl: "bottom-3" },
	},
};

const LABEL_PLACEMENT: Record<CompareOrientation, Record<CompareLabelPlacement, Record<"ltr" | "rtl", string>>> = {
	horizontal: {
		start: { ltr: "top-3", rtl: "top-3" },
		end: { ltr: "bottom-3", rtl: "bottom-3" },
	},
	vertical: {
		start: { ltr: "left-3", rtl: "right-3" },
		end: { ltr: "right-3", rtl: "left-3" },
	},
};

/** The inset classes pinning a label to its side. See {@link LABEL_EDGE}. */
export function resolveCompareLabelClass({
	side,
	placement,
	orientation,
	isRtl,
}: {
	side: CompareSide;
	placement: CompareLabelPlacement;
	orientation: CompareOrientation;
	isRtl: boolean;
}): string {
	const direction = isRtl ? "rtl" : "ltr";
	const edge = LABEL_EDGE[orientation][side === "before" ? "leading" : "trailing"][direction];
	return `${edge} ${LABEL_PLACEMENT[orientation][placement][direction]}`;
}
