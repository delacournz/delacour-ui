import { tv } from "../../lib/tv";

export const SKELETON_SHAPES = ["rect", "line", "circle"] as const;
export const SKELETON_ANIMATIONS = ["shimmer", "pulse", "none"] as const;

export type SkeletonShape = (typeof SKELETON_SHAPES)[number];
export type SkeletonAnimation = (typeof SKELETON_ANIMATIONS)[number];

/**
 * The placeholder's fill: the muted foreground at a fifth of its strength.
 *
 * Translucent on purpose. `bg-muted` sits within 0.015 lightness of the light
 * page and vanished on it; a tint of a foreground colour instead lands a clear
 * step off whatever surface it is on — page or card, light or dark — and still
 * leaves room above it for the `elevated` glint.
 */
export const SKELETON_FILL_CLASS = "bg-muted-foreground/20";

/** Animation used with no `animation` prop and nothing to inherit from. */
export const SKELETON_FALLBACK_ANIMATION: SkeletonAnimation = "shimmer";

/** One full cycle of the shared clock — a shimmer sweep, or one breath of a pulse. */
export const SKELETON_CYCLE_MS = 1500;

/** How long the content takes to fade in once it lands. */
export const SKELETON_REVEAL_MS = 200;

/**
 * The lowest opacity a pulse dims to.
 *
 * Well above zero on purpose: a placeholder that blinks out of existence reads
 * as a layout that is failing rather than one that is loading.
 */
export const SKELETON_PULSE_MIN_OPACITY = 0.5;

/** Alpha at the centre of the shimmer band, over the `elevated` token. */
export const SKELETON_SHIMMER_PEAK_OPACITY = 0.9;

/** How far across the last line of a `Skeleton.Lines` paragraph runs. */
export const SKELETON_LAST_LINE_WIDTH = 0.6;

/** One `<Stop>` of the shimmer band's gradient. */
export type SkeletonShimmerStop = { offset: number; opacity: number };

/**
 * The shimmer band's gradient, left to right.
 *
 * Transparent at both edges so the band has no visible boundary, and symmetric
 * so it reads the same whichever way it is travelling. The quarter stops sit
 * low rather than on a straight ramp, which keeps the highlight a soft glint
 * instead of a triangle with a bright ridge down its middle.
 */
export const SKELETON_SHIMMER_STOPS: readonly SkeletonShimmerStop[] = [
	{ offset: 0, opacity: 0 },
	{ offset: 0.25, opacity: SKELETON_SHIMMER_PEAK_OPACITY * 0.35 },
	{ offset: 0.5, opacity: SKELETON_SHIMMER_PEAK_OPACITY },
	{ offset: 0.75, opacity: SKELETON_SHIMMER_PEAK_OPACITY * 0.35 },
	{ offset: 1, opacity: 0 },
];

/**
 * The animation a skeleton actually runs.
 *
 * Reduce-motion stills every animation rather than hiding the placeholder: the
 * shape is the message, and a shape that stops moving still reads as content on
 * its way. The clock then never starts, which is also why the timing itself can
 * set `ReduceMotion.Never` — see AGENTS.md.
 */
export function resolveSkeletonAnimation(
	animation: SkeletonAnimation | undefined,
	isReduceMotion: boolean
): SkeletonAnimation {
	if (isReduceMotion) return "none";
	return animation ?? SKELETON_FALLBACK_ANIMATION;
}

/**
 * A pulse's opacity at a point in the cycle — opaque at both ends, at the floor
 * half way.
 *
 * A cosine rather than a triangle, so it eases into each turn instead of
 * bouncing off it, and so 0 and 1 meet with no seam as the clock wraps.
 *
 * Marked `"worklet"` and written flat, calling nothing but `Math`, for the
 * reason `switch.variants.ts` gives: a module-scope worklet that calls a sibling
 * works only while that sibling happens to be declared first.
 */
export function skeletonPulseOpacity(progress: number): number {
	"worklet";
	const mid = (1 + SKELETON_PULSE_MIN_OPACITY) / 2;
	const amplitude = (1 - SKELETON_PULSE_MIN_OPACITY) / 2;
	return mid + amplitude * Math.cos(2 * Math.PI * progress);
}

/**
 * Where the band's leading edge sits at a point in the sweep.
 *
 * Runs from wholly off the start edge to wholly off the end edge, so it enters
 * from nothing and leaves to nothing and the wrap back to 0 is invisible.
 * Before the placeholder is measured `width` is 0 and the band stays parked
 * off-screen.
 */
export function skeletonShimmerOffset(progress: number, width: number, bandWidth: number): number {
	"worklet";
	return -bandWidth + (width + bandWidth) * progress;
}

/**
 * The width of each line in a `Skeleton.Lines` paragraph.
 *
 * Only the last line is shortened, the way a paragraph ends — and only when
 * there is more than one, since a single line is a title or a label whose
 * length the caller already knows. A fractional count rounds down.
 */
export function resolveSkeletonLineWidths(lines: number, lastLineWidth = SKELETON_LAST_LINE_WIDTH): `${number}%`[] {
	const count = Math.max(0, Math.floor(lines));
	const last = Math.min(1, Math.max(0, lastLineWidth));

	return Array.from({ length: count }, (_unused, index) =>
		count > 1 && index === count - 1 ? (`${Math.round(last * 100)}%` as const) : ("100%" as const)
	);
}

/** Accessibility props a skeleton spreads onto its root. A subset of React Native's `ViewProps`. */
export type SkeletonAccessibilityProps = {
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityRole?: "progressbar";
	accessibilityState?: { busy: boolean };
	accessibilityElementsHidden?: boolean;
	importantForAccessibility?: "no-hide-descendants";
};

/** What a skeleton is to assistive technology, and the props that make it so. */
export type SkeletonAccessibility =
	| { kind: "hidden"; props: SkeletonAccessibilityProps }
	| { kind: "status"; props: SkeletonAccessibilityProps }
	| { kind: "content"; props: SkeletonAccessibilityProps };

/**
 * How a skeleton presents to a screen reader.
 *
 * An unlabelled placeholder is a picture of content that is not there, so it is
 * hidden outright — a screen of grey boxes would otherwise announce nothing
 * worth hearing, many times over. A labelled one announces once, as a busy
 * progress status. Once loaded the skeleton steps aside and the content speaks
 * for itself.
 */
export function resolveSkeletonAccessibility({
	label,
	isLoading,
}: {
	label?: string;
	isLoading: boolean;
}): SkeletonAccessibility {
	if (!isLoading) return { kind: "content", props: {} };

	if (label) {
		return {
			kind: "status",
			props: {
				accessible: true,
				accessibilityLabel: label,
				accessibilityRole: "progressbar",
				accessibilityState: { busy: true },
			},
		};
	}

	return {
		kind: "hidden",
		props: { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" },
	};
}

/**
 * Styling for every part of a skeleton.
 *
 * `isEmpty` is whether the skeleton wraps content. A wrapping skeleton is sized
 * by that content — rendered invisibly underneath while loading — so its shape
 * contributes only a corner; a default height would fight the content and then
 * clip it once it lands. A childless one needs a size of its own, and the
 * shape supplies a sensible one that a caller's className overrides.
 *
 * The paint and the clip belong to the loading state alone, so the content is
 * not left on a grey card, or cropped, once it is shown.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const skeletonVariants = tv({
	slots: {
		root: "",
		content: "",
		// Yoga sizes the band, never an animated style: 60% of the placeholder,
		// held between 48 and 240pt so a chip still gets a visible glint and a
		// full-bleed card does not get a wash. See `skeleton-shimmer.tsx`.
		band: "absolute inset-y-0 left-0 w-3/5 min-w-12 max-w-60",
	},
	variants: {
		shape: {
			rect: { root: "rounded-lg" },
			line: { root: "rounded-sm" },
			circle: { root: "rounded-full" },
		},
		isLoading: {
			true: { root: `overflow-hidden ${SKELETON_FILL_CLASS}` },
			false: {},
		},
		isEmpty: {
			true: {},
			false: {},
		},
	},
	compoundVariants: [
		{ shape: "rect", isEmpty: true, className: { root: "h-24 w-full" } },
		{ shape: "line", isEmpty: true, className: { root: "h-3.5 w-full" } },
		{ shape: "circle", isEmpty: true, className: { root: "size-10" } },
	],
	defaultVariants: {
		shape: "rect",
		isLoading: true,
		isEmpty: true,
	},
});
