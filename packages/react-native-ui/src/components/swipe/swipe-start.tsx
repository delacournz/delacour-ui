import type { ReactElement } from "react";
import type { SwipePanelProps } from "./swipe.types";

/**
 * Marks the tiles behind the row's start edge — revealed by sliding the row
 * toward `end`.
 *
 * A marker, never rendered: the root lifts its children out by element type and
 * lays them out itself, because only the root knows how wide the gap is. On its
 * own it renders nothing.
 */
export function SwipeStart(_props: SwipePanelProps): ReactElement | null {
	return null;
}
SwipeStart.displayName = "DelacourUI.Swipe.Start";
