/** The band of the z-order an overlay draws in. */
export type OverlayLayer = "modal" | "anchored" | "toast";

export const OVERLAY_LAYERS = ["modal", "anchored", "toast"] as const satisfies readonly OverlayLayer[];

/**
 * Where each layer's band starts.
 *
 * Every overlay and every bottom sheet teleports into the same `"root"` host, so
 * they are siblings ordered by `zIndex`. The sheet engine stamps its sheets from
 * 1 upward; starting the first band at 1000 puts every overlay above every sheet.
 * A dialog sits under a popover opened from it, and a toast sits above both.
 */
export const OVERLAY_LAYER_BASE = {
	modal: 1000,
	anchored: 2000,
	toast: 3000,
} as const satisfies Record<OverlayLayer, number>;

/** The layers whose top overlay answers Android's back button. A toast never does. */
const BACK_CAPTURING_LAYERS: ReadonlySet<OverlayLayer> = new Set(["modal", "anchored"]);

/** One overlay that is presented — open, or animating closed. */
export type OverlayRegistryEntry = {
	id: string;
	layer: OverlayLayer;
	/** Open order across every layer; later is larger. */
	seq: number;
};

export type OverlayRegistryState = {
	nextSeq: number;
	open: readonly OverlayRegistryEntry[];
};

export const INITIAL_OVERLAY_REGISTRY: OverlayRegistryState = { nextSeq: 1, open: [] };

export type OverlayRegistryAction = { type: "open"; id: string; layer: OverlayLayer } | { type: "close"; id: string };

/**
 * The registry as a pure reducer, so the z-order is testable without a renderer.
 *
 * An `open` stamps the next sequence number; an overlay already open is
 * re-stamped rather than duplicated, which brings it forward. A `close` of an
 * overlay that is not open returns the same state object, so an unmount racing
 * an exit causes no render.
 */
export function reduceOverlayRegistry(
	state: OverlayRegistryState,
	action: OverlayRegistryAction
): OverlayRegistryState {
	if (action.type === "close") {
		if (!state.open.some((entry) => entry.id === action.id)) return state;
		return { ...state, open: state.open.filter((entry) => entry.id !== action.id) };
	}

	const others = state.open.filter((entry) => entry.id !== action.id);
	return {
		nextSeq: state.nextSeq + 1,
		open: [...others, { id: action.id, layer: action.layer, seq: state.nextSeq }],
	};
}

/**
 * The overlay's `zIndex` while presented, `0` otherwise.
 *
 * Its layer's base plus its rank among the open overlays of that layer — a rank,
 * not the raw sequence number, so a long session's thousandth dialog still sits
 * below the first popover.
 */
export function zIndexOfOverlay(state: OverlayRegistryState, id: string): number {
	const entry = state.open.find((candidate) => candidate.id === id);
	if (entry === undefined) return 0;
	let rank = 1;
	for (const other of state.open) {
		if (other.layer === entry.layer && other.seq < entry.seq) rank++;
	}
	return OVERLAY_LAYER_BASE[entry.layer] + rank;
}

/** The back-capturing overlay drawn on top, or `null` when none is presented. */
export function topOverlay(state: OverlayRegistryState): string | null {
	let top: string | null = null;
	let topZ = 0;
	for (const entry of state.open) {
		if (!BACK_CAPTURING_LAYERS.has(entry.layer)) continue;
		const z = zIndexOfOverlay(state, entry.id);
		if (z > topZ) {
			top = entry.id;
			topZ = z;
		}
	}
	return top;
}

/** Whether `id` is the overlay a back press should close. */
export function isTopOverlay(state: OverlayRegistryState, id: string): boolean {
	return topOverlay(state) === id;
}
