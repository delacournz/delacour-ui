import { SCROLL_EDGES, type ScrollEdges } from "../../lib/scroll-edges";
import { tv } from "../../lib/tv";

/**
 * Which edges of the scrollable fade — the scroll family's shared edge union
 * from `lib/scroll-edges`, under ScrollFade's own name.
 */
export const SCROLL_FADE_EDGES = SCROLL_EDGES;
export type ScrollFadeEdges = ScrollEdges;

/** Fade depth in points when a caller names none. */
export const SCROLL_FADE_DEFAULT_SIZE = 48;

/** Travel in points from clear to full when a caller names none. */
export const SCROLL_FADE_DEFAULT_DISTANCE = 24;

/**
 * The wrapper and its edge bands.
 *
 * `root` is the positioning context and nothing more, so the scrollable inside
 * keeps the layout it would have had without the fade. A band spans the axis
 * the scroll does NOT move along — the full width over a vertical list, the
 * full height beside a horizontal one — and its depth along the scroll axis is
 * a number, so it is a style (`resolveFadeBand` in `lib/scroll-edges`) rather
 * than a class (a runtime `h-[48px]` is never compiled).
 */
export const scrollFadeVariants = tv({
	slots: {
		root: "relative",
		band: "absolute",
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
