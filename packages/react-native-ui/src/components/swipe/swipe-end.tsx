import type { ReactElement } from "react";
import type { SwipePanelProps } from "./swipe.types";

/**
 * Marks the tiles behind the row's end edge — the edge text runs toward —
 * revealed by sliding the row toward `start`.
 *
 * A marker, never rendered: the root lifts its children out by element type and
 * lays them out itself. On its own it renders nothing.
 */
export function SwipeEnd(_props: SwipePanelProps): ReactElement | null {
	return null;
}
SwipeEnd.displayName = "DelacourUI.Swipe.End";
