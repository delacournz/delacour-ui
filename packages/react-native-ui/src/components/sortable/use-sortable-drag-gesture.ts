import { type PanGesture, usePanGesture } from "react-native-gesture-handler";
import type { SortableDrag } from "./sortable.types";

export type SortableDragGestureOptions = {
	id: string;
	/** `handle` lifts on the first touch; `long-press` after `longPressDelay`. */
	mode: "handle" | "long-press";
	longPressDelay: number;
	isEnabled: boolean;
	drag: SortableDrag;
};

/**
 * The pan that lifts a row — on `Sortable.Handle` in `handle` mode, on the row in `long-press`.
 *
 * A relay and nothing more: each callback forwards the finger to the root's `drag` worklets, which
 * own every shared value and decide everything. Keeping the decisions in one place is what lets
 * one drag move every row with no render.
 *
 * **`minDistance: 0` on the handle** for the reason `Slider.Track` gives: the scroll view is React
 * Native's own, so the two race, and a pan that activates on the first touch beats its slop. In
 * `long-press` mode the scroll view is meant to win a move that comes before the hold completes.
 *
 * **`shouldCancelWhenOutside: false`** — a drag routinely leaves the handle's 44pt square at once.
 *
 * **`onFinalize`, not `onDeactivate`, drops the row**, because it is the one callback every path
 * reaches — a pan that never activated and a cancelled one included — so a row can never be left lifted.
 */
export function useSortableDragGesture({
	id,
	mode,
	longPressDelay,
	isEnabled,
	drag,
}: SortableDragGestureOptions): PanGesture {
	return usePanGesture({
		enabled: isEnabled,
		shouldCancelWhenOutside: false,
		minDistance: mode === "handle" ? 0 : undefined,
		activateAfterLongPress: mode === "handle" ? undefined : longPressDelay,
		onActivate: (event) => {
			"worklet";
			drag.begin(id, event.absoluteY);
		},
		onUpdate: (event) => {
			"worklet";
			drag.update(id, event.translationY, event.absoluteY);
		},
		onFinalize: () => {
			"worklet";
			drag.end(id);
		},
	});
}
