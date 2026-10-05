import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * The pure half of `ScrollCanvas`: its slots, its constants and the maths that
 * turns a scroll position into what the picture does.
 *
 * **Every resolver is a self-contained `"worklet"`.** They run inside
 * `useDerivedValue` / `useAnimatedStyle` on the UI thread, and a module-scope
 * helper called from a worklet can be missing from its closure there —
 * `undefined is not a function` mid-scroll, invisible to `bun test`. So each
 * writes its own clamp inline and none calls another; do not tidy the
 * repetition into a helper.
 *
 * Free of React Native imports, so the whole table is reachable from `bun test`.
 */

/** What moves inside the still frame. */
export const SCROLL_CANVAS_EFFECTS = ["parallax", "zoom", "reveal", "sequence"] as const;
export type ScrollCanvasEffect = (typeof SCROLL_CANVAS_EFFECTS)[number];

/** Parallax travel (of frame height, each way) or zoom overscale, when the caller names none. */
export const SCROLL_CANVAS_DEFAULT_DISTANCE = 0.2;

/** Frame width over height, when the caller names none. */
export const SCROLL_CANVAS_DEFAULT_ASPECT = 16 / 10;

/** Past this many frames a `sequence` warns in development: every frame is mounted at once. */
export const SCROLL_CANVAS_SEQUENCE_WARN_FRAMES = 30;

/** Where the frame's top sits in the viewport when every non-parallax effect is complete. */
const SCROLL_CANVAS_DEFAULT_END = 0.3;

/**
 * Three slots. `frame` is the still, clipped box — `bg-muted` is the placeholder
 * until the picture paints, and stays if it never does. `image` is pinned to
 * both sides and positioned vertically per effect; it restates `w-full`
 * because an `Image` with a bundled source takes the asset's own width as a
 * default style, and two insets do not override a width. `cover` is the panel a
 * `reveal` slides away; it takes the page colour so it reads as page.
 */
export const scrollCanvasVariants = tv({
	slots: {
		frame: "relative w-full overflow-hidden rounded-lg bg-muted",
		image: "absolute inset-x-0 w-full",
		cover: "absolute inset-0 bg-background",
	},
});

export type ScrollCanvasVariantProps = VariantProps<typeof scrollCanvasVariants>;

/** Positions in the viewport, 0 = top edge, 1 = bottom edge, negative = past the top. */
export type ScrollCanvasWindow = { start: number; end: number };

export type ScrollCanvasWindowInput = {
	effect: ScrollCanvasEffect;
	frameHeight: number;
	viewport: number;
	start?: number;
	end?: number;
};

/**
 * Where the frame's top sits, as a share of the viewport, when the effect starts
 * and when it completes.
 *
 * Every effect starts as the frame enters at the bottom (`1`). Parallax ends
 * just as the frame's bottom leaves at the top (`-frameHeight / viewport`), so
 * the drift covers its whole time on screen; the others complete 30% down,
 * while the picture is still well in view. An unmeasured viewport puts the
 * parallax end a whole viewport up rather than dividing by zero.
 */
export function resolveEffectWindow(input: ScrollCanvasWindowInput): ScrollCanvasWindow {
	"worklet";
	const { effect, frameHeight, viewport } = input;
	const start = input.start ?? 1;
	if (input.end !== undefined) return { start, end: input.end };
	if (effect !== "parallax") return { start, end: SCROLL_CANVAS_DEFAULT_END };
	return { start, end: viewport > 0 ? -frameHeight / viewport : -1 };
}

export type ScrollCanvasProgressInput = {
	/** The scroller's offset. */
	offset: number;
	/** The frame's top in scroll-content space. */
	frameTop: number;
	/** The scroller's visible extent. */
	viewport: number;
	window: ScrollCanvasWindow;
};

/**
 * How far through its window the effect is, 0–1.
 *
 * `f = (frameTop - offset) / viewport` is where the frame's top sits on screen;
 * progress runs from `window.start` down to `window.end` and clamps either side,
 * so a rubber band past the start holds 0. A zero-width window is a step at its
 * end. An unmeasured viewport holds 0 — the start — rather than guessing.
 */
export function resolveEffectProgress(input: ScrollCanvasProgressInput): number {
	"worklet";
	const { offset, frameTop, viewport, window } = input;
	if (viewport <= 0) return 0;

	const f = (frameTop - offset) / viewport;
	if (window.start === window.end) return f <= window.end ? 1 : 0;

	const ratio = (window.start - f) / (window.start - window.end);
	return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

export type ScrollCanvasParallax = {
	/** The image's height: the frame plus its travel above and below. */
	imageHeight: number;
	/** The image's resting top: its travel above the frame. */
	imageTop: number;
	/** The image's drift at this progress, `-travel` to `+travel`. */
	translateY: number;
};

/**
 * The parallax geometry. The image is the frame's height plus `travel` above and
 * below, and drifts from `-travel` to `+travel` — so at either end of the run one
 * of its edges is flush with the frame's, and no frame edge ever shows.
 *
 * `distance` clamps to 0–1 of the frame height. The `+ 0` keeps a zero travel
 * from coming out as `-0`.
 */
export function resolveParallax(input: {
	progress: number;
	frameHeight: number;
	distance: number;
}): ScrollCanvasParallax {
	"worklet";
	const { progress, frameHeight } = input;
	const distance = input.distance < 0 ? 0 : input.distance > 1 ? 1 : input.distance;
	const travel = distance * frameHeight;

	return {
		imageHeight: frameHeight + travel * 2,
		imageTop: 0 - travel,
		translateY: travel * (progress * 2 - 1) + 0,
	};
}

/** The zoom scale: `1 + distance` at the start, settling to 1 when complete. Never below 1. */
export function resolveZoom(input: { progress: number; distance: number }): { scale: number } {
	"worklet";
	const distance = input.distance < 0 ? 0 : input.distance > 1 ? 1 : input.distance;
	const progress = input.progress < 0 ? 0 : input.progress > 1 ? 1 : input.progress;
	return { scale: 1 + distance * (1 - progress) };
}

/**
 * How far the reveal's cover has retreated upward: none at the start, the
 * whole frame when complete, so the picture is uncovered from the bottom edge.
 */
export function resolveReveal(input: { progress: number; frameHeight: number }): { coverTranslateY: number } {
	"worklet";
	return { coverTranslateY: 0 - input.progress * input.frameHeight };
}

/**
 * Which of `count` frames is showing: progress split into equal bands, the last
 * frame owning progress 1. No frames, one frame or a negative progress all land
 * on 0.
 */
export function resolveSequenceIndex(progress: number, count: number): number {
	"worklet";
	if (count <= 1 || progress <= 0) return 0;
	const index = Math.floor(progress * count);
	return index > count - 1 ? count - 1 : index;
}

/**
 * The progress an effect rests at when motion is off — Reduce Motion, the
 * E2E calm flag, or `enabled={false}`. Each is the state that shows the
 * picture best: a centred parallax, a natural-size zoom, a fully uncovered
 * reveal, and frame 0 of a sequence (the poster).
 */
export function resolveStaticProgress(effect: ScrollCanvasEffect): number {
	"worklet";
	if (effect === "parallax") return 0.5;
	if (effect === "sequence") return 0;
	return 1;
}

export type ScrollCanvasAccessibility =
	| { accessible: true; accessibilityRole: "image"; accessibilityLabel: string }
	| { accessible: false; importantForAccessibility: "no-hide-descendants" };

/**
 * A labelled canvas is one image to assistive tech; an unlabelled one is
 * decorative and hidden, frames and cover included. An empty label counts as
 * none — an image announced as nothing is worse than one skipped.
 */
export function resolveCanvasAccessibility(label: string | undefined): ScrollCanvasAccessibility {
	if (label) return { accessible: true, accessibilityRole: "image", accessibilityLabel: label };
	return { accessible: false, importantForAccessibility: "no-hide-descendants" };
}
