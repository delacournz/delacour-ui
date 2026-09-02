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

/**
 * The baseline y for a label placed against `y`.
 *
 * `middle` centres the glyph box on `y` rather than the baseline, which is
 * what a y-axis label beside a gridline needs — anchoring the baseline instead
 * puts every label a third of a line-height too low.
 */
export function anchorY(y: number, fontHeight: number, position: LabelPosition, gap = 0): number {
	switch (position) {
		case "above":
			return y - gap;
		case "below":
			return y + gap + fontHeight;
		case "middle":
			return y + fontHeight / 2 - fontHeight * 0.15;
	}
}
