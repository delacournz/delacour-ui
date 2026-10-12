import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** How the marker sits between the entries around it. */
export const MARKER_VARIANTS = ["default", "border", "separator"] as const;

export type MarkerVariant = (typeof MARKER_VARIANTS)[number];

/**
 * Theme token an `Icon` composed into the marker is painted in.
 *
 * The same token the `content` slot paints the text in, so the glyph and the
 * words beside it are one shade — a test asserts the pair, and that both
 * themes declare it.
 */
export const MARKER_ICON_TOKEN = "muted-foreground";

/** One breath of the running shimmer: opaque, down to the floor, back. */
export const MARKER_SHIMMER_CYCLE_MS = 1600;

/**
 * The lowest opacity the running shimmer dims the text to.
 *
 * Well above zero: text that fades out entirely reads as text that is going
 * away, not as a step that is still under way.
 */
export const MARKER_SHIMMER_MIN_OPACITY = 0.45;

/** How long the text takes to settle back to opaque once the shimmer stops. */
export const MARKER_SHIMMER_SETTLE_MS = 200;

/**
 * Styling for every part of a marker.
 *
 * A marker is one quiet line, so there is no size axis — `text-xs` muted is the
 * whole type treatment. If a size is ever needed it is an addition, not a
 * guess now.
 *
 * `default` and `separator` span the row (`self-stretch`) and centre their
 * content in it; `separator` needs the span for its two rules to reach the
 * edges. `border` is the exception: `self-center`, so the hairline capsule hugs
 * its content instead of drawing a pill-shaped box across the whole row.
 *
 * The `rule` slot is what `separator` puts each side of its label. `flex-1`
 * gives it the remaining width; `self-center` overrides the `Separator`'s own
 * `self-stretch`, which inside a row would stretch it on the cross axis — tall,
 * and with no width of its own.
 *
 * The root holds no `text-*` utility (package rule 1). Content colour lives on
 * the `content` slot, and icon colour is {@link MARKER_ICON_TOKEN}. No `h-*`
 * either: `Text` respects OS font scaling, and a fixed height clips it.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const markerVariants = tv({
	slots: {
		root: "flex-row items-center justify-center gap-1.5 py-2",
		content: "shrink text-center text-muted-foreground text-xs",
		icon: "size-icon-xs",
		iconSlot: "items-center justify-center",
		rule: "flex-1 self-center",
	},
	variants: {
		variant: {
			default: { root: "self-stretch" },
			border: { root: "my-1 self-center rounded-full border border-border px-3 py-1" },
			separator: { root: "self-stretch gap-3", content: "font-medium" },
		},
		// The empty `false` branch is load-bearing typing — see button.variants.ts.
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: "default",
		isDisabled: false,
	},
});

export type MarkerVariantProps = VariantProps<typeof markerVariants>;

/**
 * Whether the root renders as a `Pressable` rather than a plain `View`.
 *
 * A marker is a note, not a control, until a caller gives it something to do —
 * the same rule as `resolveBadgeInteractive`, kept as its own function because
 * the two components may diverge.
 */
export function resolveMarkerInteractive({
	onPress,
	onLongPress,
}: {
	onPress?: () => void;
	onLongPress?: () => void;
}): boolean {
	return onPress !== undefined || onLongPress !== undefined;
}

/**
 * Whether the running shimmer should loop.
 *
 * Decorative, so calm motion — the OS reduce-motion setting or
 * `DelacourProvider`'s `isMotionCalm` — stills it. The text is then drawn at
 * full opacity; the words already say the step is running.
 */
export function resolveMarkerShimmer({ shimmer, isCalm }: { shimmer: boolean | undefined; isCalm: boolean }): boolean {
	return shimmer === true && !isCalm;
}

/**
 * The running text's opacity at a point in the cycle — opaque at both ends, at
 * the floor half way.
 *
 * A cosine, so it eases into each turn and 0 and 1 meet with no seam as the
 * clock wraps. Marked `"worklet"` and written flat, calling nothing but `Math`:
 * a worklet that calls a module-scope sibling crashes the UI thread.
 */
export function markerShimmerOpacity(progress: number): number {
	"worklet";
	const mid = (1 + MARKER_SHIMMER_MIN_OPACITY) / 2;
	const amplitude = (1 - MARKER_SHIMMER_MIN_OPACITY) / 2;
	return mid + amplitude * Math.cos(2 * Math.PI * progress);
}
