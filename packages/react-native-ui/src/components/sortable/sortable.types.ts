/** What `onReorder` is told about the move, beside the new order. */
export type SortableReorderDetails = {
	/** The row that moved. */
	id: string;
	/** Its index before the move. */
	from: number;
	/** Its index after it. */
	to: number;
};

/**
 * The drag, as three worklets the root builds and a row's gesture calls.
 *
 * The root owns every shared value a drag touches, so the gesture on a row or a handle is only a
 * relay: it forwards the finger and never decides anything itself. That is what lets one drag
 * move every row without any of them re-rendering.
 */
export type SortableDrag = {
	/** The finger has lifted the row `id`. Ignored while another row is lifted or landing. */
	begin: (id: string, absoluteY: number) => void;
	/** The finger moved. Ignored unless `id` is the lifted row. */
	update: (id: string, translationY: number, absoluteY: number) => void;
	/** The finger let go, or the gesture was cancelled. Ignored unless `id` is the lifted row. */
	end: (id: string) => void;
};
