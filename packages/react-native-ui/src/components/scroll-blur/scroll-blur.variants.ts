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

/** One native blur view in a band's stack, pinned at the band's edge. */
export type BlurStackView = { size: number; intensity: number };

/**
 * The blur views that draw a band's strips — nested, not side by side.
 *
 * Strips laid edge to edge each blur only what is behind them, so every
 * boundary is a hard cut from one radius to the next, and it shows as a seam
 * the wash cannot cover over a light ground. Nested instead, every view is
 * pinned at the edge and reaches inward to where its strip ends, and each adds
 * the same share of the edge intensity: a blur view blurs the blur views
 * beneath it, so a point covered by `n` of them sits under `n` shares — the
 * strip's own intensity — and each boundary is one small share rather than a
 * cut. Ordered widest first, which is the paint order.
 */
export function resolveBlurStack(strips: readonly BlurStrip[]): BlurStackView[] {
	return strips
		.map((strip, k) => ({
			size: strip.offset + strip.height,
			intensity: strip.intensity - (strips[k + 1]?.intensity ?? 0),
		}))
		.reverse();
}

/** The wash's alpha at the band's edge, from a `tint` clamped to 0..1. */
export function resolveBlurWash({ tint }: { tint: number }): { edgeAlpha: number } {
	return { edgeAlpha: tint < 0 ? 0 : tint > 1 ? 1 : tint };
}
