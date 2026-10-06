import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const CAROUSEL_VARIANTS = ["track", "coverflow"] as const;
export const CAROUSEL_ORIENTATIONS = ["horizontal", "vertical"] as const;
export const CAROUSEL_DOT_TONES = ["default", "overlay"] as const;

/** How the slides are drawn off `position`: flat along the axis, or turned like album covers. */
export type CarouselVariant = (typeof CAROUSEL_VARIANTS)[number];
/** The axis the slides travel along and the pan claims. */
export type CarouselOrientation = (typeof CAROUSEL_ORIENTATIONS)[number];
/** `overlay` draws light dots for sitting on photos. */
export type CarouselDotTone = (typeof CAROUSEL_DOT_TONES)[number];

/** Gap between slides, in points. */
export const CAROUSEL_GAP_POINTS = 12;
/** A resting dot's edge, in points — the `h-1.5` the dot slot carries. */
export const CAROUSEL_DOT_POINTS = 6;
/** The active dot's length along the row, in points. Its width animates; see {@link resolveDotLength}. */
export const CAROUSEL_DOT_ACTIVE_POINTS = 18;
/** How far a coverflow neighbour turns away, in degrees. */
export const COVERFLOW_ROTATE_DEG = 35;
/** The smallest a coverflow neighbour is drawn. */
export const COVERFLOW_MIN_SCALE = 0.85;
/** The dimmest a coverflow slide is drawn, two slides out. */
export const COVERFLOW_MIN_OPACITY = 0.5;
/** The camera distance a coverflow turn is drawn with. Without one `rotateY` reads as a squash. */
export const COVERFLOW_PERSPECTIVE = 800;
/** Slides mounted either side of the active one. */
export const CAROUSEL_DEFAULT_WINDOW_SIZE = 2;
/** The most dots drawn before the row becomes a sliding window. */
export const CAROUSEL_DEFAULT_MAX_DOTS = 7;
/** Time per slide while autoplaying, in milliseconds. */
export const CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS = 4000;
/** The settle under calm motion: a short timing instead of a spring. */
export const CAROUSEL_CALM_DURATION_MS = 150;

/**
 * The settle spring. Critically damped enough not to wobble a photo past its
 * slot, quick enough that a flick feels thrown rather than eased.
 */
export const CAROUSEL_SPRING = { damping: 22, mass: 0.6, stiffness: 240 } as const;

/**
 * The pan's thresholds, in points. `activate` along the travel axis before it
 * claims the touch, `fail` across it before it gives the touch up — so a
 * `Pressable` inside a slide still taps, and a scroll across the axis still
 * scrolls.
 */
export const CAROUSEL_PAN = { activate: 10, fail: 10 } as const;

/**
 * Carousel's slots.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const carouselVariants = tv({
	slots: {
		/** The column: the viewport, then any controls. */
		root: "w-full gap-3",
		/** Clips. The slides inside are absolutely placed and moved by transform, never by layout. */
		viewport: "overflow-hidden",
		/**
		 * One slide, on the card corner, pinned to the viewport's start edge and
		 * stretched across it. Its length and offset along the axis are an animated
		 * style, never a class.
		 */
		item: "absolute overflow-hidden rounded-lg",
		/** Pins a caption to the slide's foot on a scrim, so it reads over a photo. Layout only. */
		captionFrame: "absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2",
		/** The caption's text. Colour lives here, on the `Text` — rule 1. */
		caption: "text-sm text-foreground",
		/** Previous · Dots · Next. */
		controls: "items-center justify-between gap-3",
		/** The dot row. Hidden from assistive tech; the root already says "2 of 5". */
		dots: "items-center justify-center gap-1.5",
		/** One dot, at rest. Its length along the row is an animated style. */
		dot: "overflow-hidden rounded-full",
		/** The active fill laid over a dot, faded in by how close the dot is to `position`. */
		dotActive: "absolute inset-0 rounded-full",
	},
	variants: {
		variant: {
			track: {},
			coverflow: {},
		},
		orientation: {
			horizontal: { item: "inset-y-0 left-0", controls: "flex-row", dots: "flex-row", dot: "h-1.5" },
			vertical: { item: "inset-x-0 top-0", controls: "flex-col", dots: "flex-col", dot: "w-1.5" },
		},
		tone: {
			default: { dot: "bg-foreground/30", dotActive: "bg-foreground" },
			overlay: { dot: "bg-primary-foreground/40", dotActive: "bg-primary-foreground" },
		},
	},
	defaultVariants: {
		variant: "track",
		orientation: "horizontal",
		tone: "default",
	},
});

export type CarouselVariantProps = VariantProps<typeof carouselVariants>;

/** A slide's length along the axis: `itemSize`, never more than the viewport. `0` until measured. */
export function resolveItemSize(viewport: number, itemSize: number | undefined): number {
	if (viewport <= 0) return 0;
	if (itemSize === undefined || itemSize <= 0 || itemSize > viewport) return viewport;
	return itemSize;
}

/**
 * The distance from one slide to the next: a slide plus the gap.
 *
 * With no `itemSize` that is a full viewport plus the gap, so a neighbour sits
 * wholly off-screen rather than its edge showing.
 */
export function resolveItemPitch(viewport: number, itemSize: number | undefined, gap: number): number {
	if (viewport <= 0) return 0;
	return resolveItemSize(viewport, itemSize) + gap;
}

/** The inset that centres the active slide when it is smaller than the viewport. */
export function resolveItemInset(viewport: number, itemSize: number | undefined): number {
	const size = resolveItemSize(viewport, itemSize);
	const inset = (viewport - size) / 2;
	return inset > 0 ? inset : 0;
}

/** A slide's translate along the axis, for its offset from `position`. */
export function resolveSlideTranslate(offset: number, pitch: number, inset: number): number {
	"worklet";
	return inset + offset * pitch;
}

/**
 * A coverflow slide's turn, scale and opacity for its offset from `position`.
 *
 * Scale and rotation reach their floors one slide out; opacity keeps falling to
 * its floor two out, so the far slides recede. A slide to the right (positive
 * offset) turns to face left — a negative `rotateY`. `isCalm` returns the
 * identity: under reduce motion coverflow is drawn as a plain track.
 *
 * Self-contained, so a slide's animated style can call it on the UI thread.
 */
export function resolveCoverflow(offset: number, isCalm: boolean): { scale: number; opacity: number; rotateY: number } {
	"worklet";
	if (isCalm) return { opacity: 1, rotateY: 0, scale: 1 };

	const clamped = offset > 1 ? 1 : offset < -1 ? -1 : offset;
	const near = clamped < 0 ? -clamped : clamped;
	const distance = offset < 0 ? -offset : offset;
	const far = distance > 2 ? 2 : distance;

	return {
		opacity: 1 - ((1 - COVERFLOW_MIN_OPACITY) / 2) * far,
		rotateY: -COVERFLOW_ROTATE_DEG * clamped + 0,
		scale: 1 - (1 - COVERFLOW_MIN_SCALE) * near,
	};
}

/**
 * Which dots to draw: every one when they fit, otherwise a window of `max`
 * centred on the active dot and pinned at each end. `end` is exclusive.
 */
export function resolveDotsWindow(count: number, active: number, max: number): { start: number; end: number } {
	if (count <= 0) return { end: 0, start: 0 };
	if (count <= max) return { end: count, start: 0 };

	let start = active - Math.floor(max / 2);
	if (start < 0) start = 0;
	if (start > count - max) start = count - max;
	return { end: start + max, start };
}

/**
 * A dot's length along the row for its offset from `position`: the resting dot
 * one slide out, the active pill at zero. Width rather than `scaleX`, because a
 * scaled `rounded-full` is an ellipse — `Tabs.Indicator`'s reason.
 */
export function resolveDotLength(offset: number): number {
	"worklet";
	const distance = offset < 0 ? -offset : offset;
	const t = distance >= 1 ? 0 : 1 - distance;
	return CAROUSEL_DOT_POINTS + (CAROUSEL_DOT_ACTIVE_POINTS - CAROUSEL_DOT_POINTS) * t;
}

/** A caption's opacity for its slide's offset: full on the active slide, gone one slide out. */
export function resolveCaptionOpacity(offset: number): number {
	"worklet";
	const distance = offset < 0 ? -offset : offset;
	return distance >= 1 ? 0 : 1 - distance;
}

/** The slide autoplay moves to next, and whether it has run out. */
export function resolveAutoplayNext(index: number, count: number, loop: boolean): { next: number; stop: boolean } {
	if (count <= 1) return { next: index, stop: true };
	if (index + 1 < count) return { next: index + 1, stop: false };
	if (loop) return { next: 0, stop: false };
	return { next: index, stop: true };
}

/**
 * Whether autoplay runs at all.
 *
 * Moving content the user did not ask for is held still under reduce motion and
 * while a screen reader is on (WCAG 2.2.2), as well as when the carousel is
 * disabled or has nothing to move to.
 */
export function resolveAutoplayEnabled(state: {
	autoplay: boolean;
	isCalm: boolean;
	isScreenReader: boolean;
	isDisabled: boolean;
	count: number;
}): boolean {
	return state.autoplay && !state.isCalm && !state.isScreenReader && !state.isDisabled && state.count > 1;
}

/** What the adjustable root reads out: "2 of 5". Empty with nothing to count. */
export function resolveCarouselA11yValue(index: number, count: number): string {
	if (count <= 0) return "";
	return `${index + 1} of ${count}`;
}

/** Whether Previous and Next have anywhere to go. */
export function resolveNavigationState(
	index: number,
	count: number,
	loop: boolean
): { canGoPrevious: boolean; canGoNext: boolean } {
	if (count <= 1) return { canGoNext: false, canGoPrevious: false };
	if (loop) return { canGoNext: true, canGoPrevious: true };
	return { canGoNext: index < count - 1, canGoPrevious: index > 0 };
}

/** An index pulled into `[0, count - 1]`, so a shrinking run never leaves a dead one. */
export function resolveClampedIndex(index: number, count: number): number {
	if (count <= 0) return 0;
	const rounded = Math.round(index);
	if (rounded <= 0) return 0;
	if (rounded >= count - 1) return count - 1;
	return rounded;
}

/**
 * What a slide tells assistive technology.
 *
 * A neighbour that is off-screen is hidden, so a swipe through VoiceOver does not
 * land on a slide nobody can see. A neighbour that PEEKS is visible, so it stays
 * reachable. The two platform props are one decision, so they live in one place.
 */
export function resolveSlideAccessibility(state: { isActive: boolean; isPeek: boolean }): {
	accessibilityElementsHidden: boolean;
	importantForAccessibility: "auto" | "no-hide-descendants";
} {
	return state.isActive || state.isPeek
		? { accessibilityElementsHidden: false, importantForAccessibility: "auto" }
		: { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" };
}
