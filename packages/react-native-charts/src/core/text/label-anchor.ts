/** Where a label sits relative to the point it labels, horizontally. */
export type LabelAlignment = "start" | "middle" | "end";

/** Where a label sits relative to the point it labels, vertically. */
export type LabelPosition = "above" | "below" | "middle";

/**
 * Skia draws text from the left edge of the baseline, so a label centred under
 * a tick needs the left edge moved half its own width. Every label placement in
 * the package goes through here rather than each axis re-deriving it and one of
 * them getting the sign wrong.
 */
export function anchorX(x: number, width: number, alignment: LabelAlignment): number {
	switch (alignment) {
		case "start":
			return x;
		case "middle":
			return x - width / 2;
		case "end":
			return x - width;
	}
}

/** A font's vertical extents, both positive, measured from the baseline. */
export type LabelMetrics = {
	/** How far the tallest glyph rises above the baseline. */
	readonly ascent: number;
	/** How far the deepest descender falls below it. */
	readonly descent: number;
};

/** The full glyph box a label occupies — what a gutter has to reserve. */
export function labelHeight(metrics: LabelMetrics): number {
	return metrics.ascent + metrics.descent;
}

/**
 * The baseline y for a label placed against `y`.
 *
 * Skia positions text by its **baseline**, and a glyph box straddles that
 * line: ascent above it, descent below. So every case here is stated in terms
 * of where the box's edge should land, and the baseline falls out.
 *
 * That distinction is not pedantry. Placing a `below` label a whole line-height
 * under the plot puts its baseline where the box's *bottom* should be, and the
 * descenders — the tail of a `Q`, the hook of a `y` — hang past the gutter that
 * was reserved for them and are sliced off by the edge of the canvas. A label
 * of `Jan` looks perfect and a label of `Q1` is visibly cut.
 */
export function anchorY(y: number, metrics: LabelMetrics, position: LabelPosition, gap = 0): number {
	switch (position) {
		// The box's bottom edge sits `gap` above `y`.
		case "above":
			return y - gap - metrics.descent;
		// The box's top edge sits `gap` below `y`.
		case "below":
			return y + gap + metrics.ascent;
		// The box is centred on `y`, which is what a label beside a gridline needs.
		case "middle":
			return y + (metrics.ascent - metrics.descent) / 2;
	}
}
