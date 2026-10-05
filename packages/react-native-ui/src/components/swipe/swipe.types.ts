import type { ReactNode } from "react";

/** `Swipe.Start` and `Swipe.End` — markers whose children are the panel's tiles. */
export type SwipePanelProps = {
	/** One or more `Swipe.Action`s, in visual order. */
	children: ReactNode;
};
