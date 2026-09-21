import type { ChartOrientation } from "../chart.types";
import type { BarRect } from "../shape/build-bars";
import { anchorX, anchorY, type LabelMetrics } from "./label-anchor";

/**
 * Where a bar's label sits, relative to the bar.
 *
 * `top` and `bottom` are the value end and the base end, so a negative bar
 * flips them: its `top` label hangs below the bar, where its value is read.
 * `left` and `right` are canvas sides and do not flip.
 */
export type BarLabelPosition = "top" | "bottom" | "left" | "right";

export type BarLabelAnchorOptions = {
	readonly rect: BarRect;
	readonly position: BarLabelPosition;
	/** The label's measured advance width. */
	readonly width: number;
	readonly metrics: LabelMetrics;
	/** Space between the bar's edge and the glyph box. Defaults to 4. */
	readonly gap?: number;
	/** On a horizontal bar the value end is a side, so `top` and `bottom` follow it there. */
	readonly orientation?: ChartOrientation;
};

/** Skia's text origin — left end of the baseline — for a label on a bar. */
export function barLabelAnchor(options: BarLabelAnchorOptions): { readonly x: number; readonly y: number } {
	const { rect, position, width, metrics, gap = 4, orientation = "vertical" } = options;
	const centreX = (rect.left + rect.right) / 2;
	const centreY = (rect.top + rect.bottom) / 2;
	const beside = (side: "left" | "right"): { readonly x: number; readonly y: number } =>
		side === "left"
			? { x: anchorX(rect.left, width, "end") - gap, y: anchorY(centreY, metrics, "middle") }
			: { x: rect.right + gap, y: anchorY(centreY, metrics, "middle") };

	if (orientation === "horizontal") {
		switch (position) {
			case "top":
				return beside(rect.negative ? "left" : "right");
			case "bottom":
				return beside(rect.negative ? "right" : "left");
			case "left":
			case "right":
				return beside(position);
		}
	}

	switch (position) {
		case "top":
			return rect.negative
				? { x: anchorX(centreX, width, "middle"), y: anchorY(rect.bottom, metrics, "below", gap) }
				: { x: anchorX(centreX, width, "middle"), y: anchorY(rect.top, metrics, "above", gap) };
		case "bottom":
			return rect.negative
				? { x: anchorX(centreX, width, "middle"), y: anchorY(rect.top, metrics, "above", gap) }
				: { x: anchorX(centreX, width, "middle"), y: anchorY(rect.bottom, metrics, "below", gap) };
		case "left":
		case "right":
			return beside(position);
	}
}
