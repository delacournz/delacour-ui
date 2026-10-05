import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The furthest a pinch may zoom in, and where the accessibility `zoomIn` steps stop. */
export const VIEWER_MAX_SCALE = 4;
/** The zoom a double-tap toggles to. */
export const VIEWER_DOUBLE_TAP_SCALE = 2.5;
/** Gap between two pages of the gallery, in points. */
export const VIEWER_PAGE_GAP_POINTS = 16;
/** A drag further than this fraction of the window's height dismisses. */
export const VIEWER_DISMISS_DISTANCE_FRACTION = 0.15;
/** A vertical release faster than this, in points per second, dismisses. */
export const VIEWER_DISMISS_VELOCITY = 800;
/** The smallest the image shrinks to while it is dragged away. */
export const VIEWER_DISMISS_MIN_SCALE = 0.8;
/** Points a pan travels before it claims an axis. */
export const VIEWER_PAN_ACTIVATE = 10;
/** Any scale above this counts as zoomed: the chrome hides and the pager yields to panning. */
export const VIEWER_ZOOMED_THRESHOLD = 1.05;
/** Every fade under calm motion, and the full-resolution source's cross-fade. */
export const VIEWER_FADE_DURATION_MS = 150;
/** The flight home when the viewer closes to its thumbnail. */
export const VIEWER_CLOSE_DURATION_MS = 260;
/** How far, in points, a translation past its bound may give. */
export const VIEWER_RUBBER_BAND_POINTS = 80;

/**
 * The flight spring: open, zoom settles, restore. Damped so a photo lands rather
 * than wobbles, quick enough that a tap feels answered.
 */
export const VIEWER_SPRING = { damping: 24, mass: 0.7, stiffness: 260 } as const;

/** A rectangle in window coordinates, in points. */
export type ViewerRect = { x: number; y: number; width: number; height: number };
/** A width and a height, in points. */
export type ViewerSize = { width: number; height: number };
/** A point in window coordinates, or an offset, in points. */
export type ViewerPoint = { x: number; y: number };
/** Safe-area insets, in points. */
export type ViewerInsets = { top: number; bottom: number; left: number; right: number };
/** How far a zoomed image may pan either way from centre, in points. */
export type ViewerBounds = { maxX: number; maxY: number };
/** A zoom: a scale about the frame's centre, then a translation. */
export type ViewerTransform = { scale: number; translation: ViewerPoint };
/** Which way a drag at rest went: the pager, the dismiss, or not far enough yet. */
export type ViewerDragAxis = "horizontal" | "vertical" | "undecided";
/** Where a closing viewer goes: back into its thumbnail, or a plain fade. */
export type ViewerCloseTarget = "origin" | "fade";

/** A source as React Native's `Image` takes it: a `require` number, a `{ uri }`, or a list of them. */
export type ViewerImageSource = number | { uri?: string } | readonly { uri?: string }[];

/** The fields of an image the viewer compares. Structural, so it stays free of React Native types. */
export type ViewerImageLike = {
	id: string;
	source: ViewerImageSource;
	fullSource?: ViewerImageSource;
	alt: string;
	caption?: string;
	width?: number;
	height?: number;
};

/**
 * ImageViewer's slots.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const imageViewerVariants = tv({
	slots: {
		/** The thumbnail: clips its image, and shows a muted swatch while it loads. Sized by the caller. */
		trigger: "overflow-hidden bg-muted",
		/** The opaque stage behind the image, dark in both themes. Its opacity is animated. */
		backdrop: "absolute inset-0 bg-media",
		/** Close and counter, across the top. The safe-area top is added in JS. */
		chrome: "absolute inset-x-0 top-0 flex-row items-center justify-between px-screen-gutter",
		/** "2 / 5". Colour lives on the `Text` — rule 1. */
		counter: "text-sm text-media-foreground",
		/** Pins the caption to the foot. Layout only. */
		captionFrame: "absolute inset-x-0 bottom-0 px-screen-gutter",
		/** The caption's text. */
		caption: "text-center text-sm text-media-foreground",
		/** A thumbnail that failed with nothing to fall back on. */
		error: "absolute inset-0 items-center justify-center gap-2",
		/** The failure's message. */
		errorText: "text-sm text-media-foreground",
	},
});

export type ImageViewerVariantProps = VariantProps<typeof imageViewerVariants>;

/**
 * The image's rest frame: `aspect` (width / height) fitted inside the window less
 * its insets, centred. A bad aspect fills the box; an unmeasured window is zero.
 */
export function resolveFittedRect(aspect: number, window: ViewerSize, insets: ViewerInsets): ViewerRect {
	"worklet";
	const boxX = insets.left;
	const boxY = insets.top;
	const boxWidth = Math.max(0, window.width - insets.left - insets.right);
	const boxHeight = Math.max(0, window.height - insets.top - insets.bottom);
	if (boxWidth <= 0 || boxHeight <= 0) return { height: 0, width: 0, x: 0, y: 0 };
	if (!(aspect > 0) || !Number.isFinite(aspect)) return { height: boxHeight, width: boxWidth, x: boxX, y: boxY };

	let width = boxWidth;
	let height = width / aspect;
	if (height > boxHeight) {
		height = boxHeight;
		width = height * aspect;
	}
	return { height, width, x: boxX + (boxWidth - width) / 2, y: boxY + (boxHeight - height) / 2 };
}

/** The flying frame at `progress`: the thumbnail's at 0, the fitted rect at 1, linear between. Clamped. */
export function resolveFrameAt(progress: number, origin: ViewerRect, fitted: ViewerRect): ViewerRect {
	"worklet";
	const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
	return {
		height: origin.height + (fitted.height - origin.height) * t,
		width: origin.width + (fitted.width - origin.width) * t,
		x: origin.x + (fitted.x - origin.x) * t,
		y: origin.y + (fitted.y - origin.y) * t,
	};
}

/** The frame's corner at `progress`: the thumbnail's own at 0, square at 1. */
export function resolveCornerRadiusAt(progress: number, cornerRadius: number): number {
	"worklet";
	const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
	return cornerRadius * (1 - t);
}

/**
 * How far a zoomed image may pan. Each axis is half the overflow of the scaled
 * frame past the window, so an image still shorter than the window stays centred
 * on that axis until it overflows. At or below 1 there is nothing to pan.
 */
export function resolveTranslateBounds(scale: number, fitted: ViewerSize, window: ViewerSize): ViewerBounds {
	"worklet";
	if (scale <= 1) return { maxX: 0, maxY: 0 };
	const maxX = (fitted.width * scale - window.width) / 2;
	const maxY = (fitted.height * scale - window.height) / 2;
	return { maxX: maxX > 0 ? maxX : 0, maxY: maxY > 0 ? maxY : 0 };
}

/**
 * A translation held inside `bounds`. With `rubber` the overshoot is compressed
 * exponentially toward {@link VIEWER_RUBBER_BAND_POINTS} instead of stopping
 * dead — always less than asked, so the image visibly resists under the finger.
 */
export function resolveClampedTranslation(translation: ViewerPoint, bounds: ViewerBounds, rubber = false): ViewerPoint {
	"worklet";
	const band = VIEWER_RUBBER_BAND_POINTS;
	const clampAxis = (value: number, max: number): number => {
		"worklet";
		if (value > max) return rubber ? max + band * (1 - Math.exp(-(value - max) / band)) : max;
		if (value < -max) return rubber ? -max - band * (1 - Math.exp((value + max) / band)) : -max;
		return value;
	};
	return { x: clampAxis(translation.x, bounds.maxX), y: clampAxis(translation.y, bounds.maxY) };
}

/**
 * The zoom while two fingers pinch.
 *
 * The content point under the starting focal is held under the fingers: as the
 * scale changes, the translation moves to keep it there, and `focalDelta` (how
 * far the fingers' midpoint has travelled) carries the image with them. Below 1
 * and past `maxScale` the scale rubber-bands instead of stopping.
 */
export function resolvePinchTransform(state: {
	startScale: number;
	startTranslation: ViewerPoint;
	pinchScale: number;
	focal: ViewerPoint;
	focalDelta?: ViewerPoint;
	center: ViewerPoint;
	maxScale: number;
}): ViewerTransform {
	"worklet";
	const raw = state.startScale * state.pinchScale;
	let scale = raw;
	if (raw < 1) {
		const band = 0.5;
		scale = 1 - band * (1 - Math.exp(-(1 - raw) / band));
	} else if (raw > state.maxScale) {
		const band = state.maxScale * 0.25;
		scale = state.maxScale + band * (1 - Math.exp(-(raw - state.maxScale) / band));
	}

	const ratio = state.startScale > 0 ? scale / state.startScale : 1;
	const dx = state.focal.x - state.center.x;
	const dy = state.focal.y - state.center.y;
	const shiftX = state.focalDelta ? state.focalDelta.x : 0;
	const shiftY = state.focalDelta ? state.focalDelta.y : 0;

	return {
		scale,
		translation: {
			x: dx - ratio * (dx - state.startTranslation.x) + shiftX,
			y: dy - ratio * (dy - state.startTranslation.y) + shiftY,
		},
	};
}

/**
 * Where a double-tap goes. At rest it zooms to `doubleTapScale` with the tapped
 * point held still, clamped into `bounds` (the bounds AT that scale); zoomed, it
 * resets to 1, centred.
 */
export function resolveDoubleTapTarget(state: {
	scale: number;
	doubleTapScale: number;
	tap: ViewerPoint;
	center: ViewerPoint;
	bounds: ViewerBounds;
}): ViewerTransform {
	"worklet";
	if (state.scale > VIEWER_ZOOMED_THRESHOLD) return { scale: 1, translation: { x: 0, y: 0 } };

	const k = 1 - state.doubleTapScale;
	const x = k * (state.tap.x - state.center.x);
	const y = k * (state.tap.y - state.center.y);
	const { maxX, maxY } = state.bounds;
	return {
		scale: state.doubleTapScale,
		translation: { x: (x > maxX ? maxX : x < -maxX ? -maxX : x) + 0, y: (y > maxY ? maxY : y < -maxY ? -maxY : y) + 0 },
	};
}

/** The accessibility `zoomIn` step: 1 → `doubleTapScale` → `maxScale`, and no further. */
export function resolveNextZoomStep(scale: number, doubleTapScale: number, maxScale: number): number {
	if (scale < doubleTapScale - 0.01) return doubleTapScale;
	return maxScale;
}

/** The accessibility `zoomOut` step: back down the same ladder, floor 1. */
export function resolvePreviousZoomStep(scale: number, doubleTapScale: number): number {
	if (scale > doubleTapScale + 0.01) return doubleTapScale;
	return 1;
}

/**
 * Which axis a drag at rest claims. The first past `activateAt` wins — the larger
 * when both are — and the caller decides it **once** per gesture: a drag that
 * started paging never turns into a dismiss.
 */
export function resolveDragAxis(state: {
	translationX: number;
	translationY: number;
	activateAt: number;
}): ViewerDragAxis {
	"worklet";
	const ax = Math.abs(state.translationX);
	const ay = Math.abs(state.translationY);
	if (ax < state.activateAt && ay < state.activateAt) return "undecided";
	return ax >= ay ? "horizontal" : "vertical";
}

/**
 * Whether a vertical drag dismisses on release. A flick faster than
 * {@link VIEWER_DISMISS_VELOCITY} decides by its direction — with the drag it
 * dismisses, back against it it restores — otherwise a drag past
 * {@link VIEWER_DISMISS_DISTANCE_FRACTION} of the window dismisses. Up works too.
 */
export function resolveDismissDecision(
	translationY: number,
	velocityY: number,
	windowHeight: number
): "dismiss" | "restore" {
	"worklet";
	if (Math.abs(velocityY) > VIEWER_DISMISS_VELOCITY) {
		if (translationY === 0) return "dismiss";
		return translationY > 0 === velocityY > 0 ? "dismiss" : "restore";
	}
	return Math.abs(translationY) > windowHeight * VIEWER_DISMISS_DISTANCE_FRACTION ? "dismiss" : "restore";
}

/** The backdrop while dragged away: gone at half a window, either way. */
export function resolveBackdropOpacity(translationY: number, windowHeight: number): number {
	"worklet";
	if (windowHeight <= 0) return 1;
	const t = Math.abs(translationY) / (0.5 * windowHeight);
	return 1 - (t > 1 ? 1 : t);
}

/** The image while dragged away: a gentle shrink to {@link VIEWER_DISMISS_MIN_SCALE} at half a window. */
export function resolveDismissScale(translationY: number, windowHeight: number): number {
	"worklet";
	if (windowHeight <= 0) return 1;
	const t = Math.abs(translationY) / (0.5 * windowHeight);
	return 1 - (1 - VIEWER_DISMISS_MIN_SCALE) * (t > 1 ? 1 : t);
}

/** Fly home only to a thumbnail that can be seen, and never under calm motion. */
export function resolveCloseTarget(state: { originVisible: boolean; calm: boolean }): ViewerCloseTarget {
	return state.originVisible && !state.calm ? "origin" : "fade";
}

/** Whether any of the thumbnail's frame is on screen. No frame, or a zero one, is not. */
export function resolveOriginVisible(origin: ViewerRect | null, window: ViewerSize): boolean {
	if (!origin || origin.width <= 0 || origin.height <= 0) return false;
	return (
		origin.x + origin.width > 0 && origin.x < window.width && origin.y + origin.height > 0 && origin.y < window.height
	);
}

/** An index pulled into the gallery, rounded. `0` for an empty one. */
export function resolveViewerIndex(index: number, count: number): number {
	if (count <= 0) return 0;
	const rounded = Math.round(index);
	if (rounded <= 0) return 0;
	if (rounded >= count - 1) return count - 1;
	return rounded;
}

/**
 * The composed-mode gallery: every registered image in mount order. A second
 * registration of one `id` keeps the first one's place and the latest data.
 */
export function resolveGalleryOrder<T extends ViewerImageLike>(
	registrations: readonly { image: T; sequence: number }[]
): T[] {
	const byId = new Map<string, { image: T; sequence: number }>();
	for (const entry of registrations) {
		const existing = byId.get(entry.image.id);
		if (!existing) byId.set(entry.image.id, { image: entry.image, sequence: entry.sequence });
		else if (entry.sequence >= existing.sequence) {
			byId.set(entry.image.id, { image: entry.image, sequence: existing.sequence });
		} else {
			byId.set(entry.image.id, { image: existing.image, sequence: entry.sequence });
		}
	}
	return [...byId.values()].sort((a, b) => a.sequence - b.sequence).map((entry) => entry.image);
}

function isSameSource(a: ViewerImageSource | undefined, b: ViewerImageSource | undefined): boolean {
	if (a === b) return true;
	if (a === undefined || b === undefined) return false;
	if (typeof a === "number" || typeof b === "number") return false;
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
		return a.every((entry, i) => entry.uri === b[i]?.uri);
	}
	return (a as { uri?: string }).uri === (b as { uri?: string }).uri;
}

/**
 * Whether two registrations describe the same image, by value. A Trigger handed a
 * fresh `{ uri }` literal every render must not re-register every render — that
 * re-renders the root, which re-renders the Trigger, forever.
 */
export function isSameImage(a: ViewerImageLike, b: ViewerImageLike): boolean {
	return (
		a.id === b.id &&
		a.alt === b.alt &&
		a.caption === b.caption &&
		a.width === b.width &&
		a.height === b.height &&
		isSameSource(a.source, b.source) &&
		isSameSource(a.fullSource, b.fullSource)
	);
}

/** What the pager tells assistive tech: "2 of 5". Empty with nothing to count. */
export function resolveViewerA11yValue(index: number, count: number): string {
	if (count <= 0) return "";
	return `${index + 1} of ${count}`;
}
