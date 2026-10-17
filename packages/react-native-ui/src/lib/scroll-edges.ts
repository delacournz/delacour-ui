/**
 * The pure geometry of an affordance drawn at a scrollable's edges — where each
 * band sits and which way its gradient runs. `ScrollFade` paints a gradient in
 * these bands and `ScrollBlur` a blur, so the geometry lives here rather than in
 * either component's folder, and neither has to import the other.
 *
 * Every function is a self-contained worklet, for the reason `scroll-maths.ts`
 * gives: a helper called from inside a worklet can be missing from its closure
 * on the UI thread. Free of React Native imports, so `bun test` reaches it all.
 */

import type { ScrollEdge, ScrollOrientation } from "./scroll-maths";

/** Which edges of a scrollable draw an affordance. */
export const SCROLL_EDGES = ["both", "start", "end", "none"] as const;
export type ScrollEdges = (typeof SCROLL_EDGES)[number];

/** Whether each edge draws a band at all. */
export function resolveFadeEdges(edges: ScrollEdges): { start: boolean; end: boolean } {
	"worklet";
	return {
		start: edges === "both" || edges === "start",
		end: edges === "both" || edges === "end",
	};
}

/** The placement of one band, as absolute-position style props. Only the keys that apply are present. */
export type FadeBandStyle =
	| { top: number; height: number }
	| { bottom: number; height: number }
	| { left: number; width: number }
	| { right: number; width: number };

export type FadeBandInput = {
	orientation: ScrollOrientation;
	edge: ScrollEdge;
	/** Depth in points along the scroll axis. */
	size: number;
	/** Points to hold the band in from its edge. */
	inset: number;
};

/**
 * Where one band sits: pinned `inset` points in from its edge, `size` deep
 * along the scroll axis. The band spans the other axis through its class
 * (`inset-x-0` / `inset-y-0`), not through this style.
 *
 * `start` and `end` follow the scroll axis in layout space — top and bottom,
 * left and right — so they do not flip under right-to-left on their own.
 */
export function resolveFadeBand({ orientation, edge, size, inset }: FadeBandInput): FadeBandStyle {
	"worklet";
	if (orientation === "vertical") {
		return edge === "start" ? { top: inset, height: size } : { bottom: inset, height: size };
	}

	return edge === "start" ? { left: inset, width: size } : { right: inset, width: size };
}

/** A gradient's direction, in the unit square `expo-linear-gradient` takes. */
export type FadeGradientVector = { start: { x: number; y: number }; end: { x: number; y: number } };

/**
 * The direction of one band's gradient: from its own edge, where the colour is
 * solid, inward to where it has faded out. A blur mask runs the same way.
 */
export function resolveFadeGradient({
	orientation,
	edge,
}: {
	orientation: ScrollOrientation;
	edge: ScrollEdge;
}): FadeGradientVector {
	"worklet";
	const near = edge === "start" ? 0 : 1;
	const far = 1 - near;

	if (orientation === "vertical") return { start: { x: 0, y: near }, end: { x: 0, y: far } };

	return { start: { x: near, y: 0 }, end: { x: far, y: 0 } };
}
