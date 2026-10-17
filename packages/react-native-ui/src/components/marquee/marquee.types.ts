import type { ReactNode } from "react";
import type { MarqueeAxis } from "./marquee.variants";

/** What the moving track and the still scroller both take from the root. */
export type MarqueeStripProps = {
	children: ReactNode;
	axis: MarqueeAxis;
	/** The copy's classes — axis, trailing gap, and the caller's `contentClassName`. */
	copyClassName: string;
	/** The root carries an `accessibilityLabel`, so the content is hidden and the label speaks for it. */
	isContentHidden: boolean;
};
