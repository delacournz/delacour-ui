import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * Styling for a scroll blur.
 *
 * `root` is the positioning context the bands are absolute within; a caller's
 * `flex-1` lands here. `band` is one edge's container — clipped, so no strip's
 * blur bleeds past the band, and spanning the cross axis by class while
 * `resolveFadeBand` places it along the scroll axis by style.
 */
export const scrollBlurVariants = tv({
	slots: {
		root: "relative",
		band: "absolute overflow-hidden",
	},
	variants: {
		orientation: {
			vertical: { band: "inset-x-0" },
			horizontal: { band: "inset-y-0" },
		},
	},
	defaultVariants: {
		orientation: "vertical",
	},
});

export type ScrollBlurVariantProps = VariantProps<typeof scrollBlurVariants>;

/** The most strips a band may stack; each is a native blur view. */
const MAX_BLUR_LAYERS = 16;

/** One blur strip, measured from its band's edge. */
export type BlurStrip = { offset: number; height: number; intensity: number };

/**
 * The strips a band stacks to approximate a progressive blur.
 *
 * No engine blurs on a gradient, so the band is cut into `layers` equal strips
 * ordered from the edge inward, each blurring less than the one before —
 * `intensity * (layers - k) / layers` — until the innermost is a fraction of
 * the edge's. The wash painted over them hides the steps between.
 *
 * `layers` is floored and clamped to 1..16, `intensity` to 0..100, and a band
 * with no depth draws no strips at all.
 */
export function resolveBlurLayers({
	size,
	layers,
	intensity,
}: {
	size: number;
	layers: number;
	intensity: number;
}): BlurStrip[] {
	if (size <= 0) return [];

	const count = Math.min(MAX_BLUR_LAYERS, Math.max(1, Math.floor(layers)));
	const edge = intensity < 0 ? 0 : intensity > 100 ? 100 : intensity;
	const height = size / count;

	return Array.from({ length: count }, (_, k) => ({
		offset: height * k,
		height,
		intensity: (edge * (count - k)) / count,
	}));
}

/** The wash's alpha at the band's edge, from a `tint` clamped to 0..1. */
export function resolveBlurWash({ tint }: { tint: number }): { edgeAlpha: number } {
	return { edgeAlpha: tint < 0 ? 0 : tint > 1 ? 1 : tint };
}
