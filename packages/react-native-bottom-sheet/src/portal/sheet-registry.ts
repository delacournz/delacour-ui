/** One sheet that is currently presented — open, or on its way closed. */
export type SheetRegistryEntry = {
	id: string;
	/** The host the sheet's frame lives in; `replace` and `top` are scoped to it. */
	host: string;
	/** Later opens get larger numbers, so the sibling order in a host is the open order. */
	z: number;
};

export type SheetRegistryState = {
	nextZ: number;
	open: readonly SheetRegistryEntry[];
};

export const INITIAL_REGISTRY: SheetRegistryState = { nextZ: 1, open: [] };

export type StackBehavior = "push" | "replace";

export type SheetRegistryAction =
	| { type: "open"; id: string; host: string; behavior: StackBehavior }
	| { type: "close"; id: string };

export type SheetRegistryResult = {
	state: SheetRegistryState;
	/** Sheets the action displaced: a `replace` open's victims. The provider tells each to close. */
	closed: readonly string[];
};

/**
 * The registry as a pure reducer over plain data, so the z-order, `replace` and
 * `dismissAll` are testable without a renderer.
 *
 * An `open` stamps the next `z` and puts the sheet on top of its host; a sheet
 * already open is re-stamped rather than duplicated, so re-presenting brings
 * it forward. With `replace`, every other sheet in the same host is dropped
 * and reported in `closed` — the provider calls their `close()`, and their
 * own settle at `-1` is then a no-op here. A `close` of a sheet that is not
 * open returns the same state object, so a settle that races an unmount
 * causes no render.
 */
export function reduceRegistry(state: SheetRegistryState, action: SheetRegistryAction): SheetRegistryResult {
	if (action.type === "close") {
		if (!state.open.some((entry) => entry.id === action.id)) return { state, closed: [] };
		return { state: { ...state, open: state.open.filter((entry) => entry.id !== action.id) }, closed: [] };
	}

	const others = state.open.filter((entry) => entry.id !== action.id);
	const displaced = action.behavior === "replace" ? others.filter((entry) => entry.host === action.host) : [];
	const kept = displaced.length === 0 ? others : others.filter((entry) => entry.host !== action.host);
	const entry: SheetRegistryEntry = { id: action.id, host: action.host, z: state.nextZ };
	return {
		state: { nextZ: state.nextZ + 1, open: [...kept, entry] },
		closed: displaced.map((victim) => victim.id),
	};
}

/** The sheet drawn on top in `host`, or `null` when nothing is presented there. */
export function topOf(state: SheetRegistryState, host: string): string | null {
	let top: SheetRegistryEntry | null = null;
	for (const entry of state.open) {
		if (entry.host !== host) continue;
		if (top === null || entry.z > top.z) top = entry;
	}
	return top === null ? null : top.id;
}

/** The sheet's `zIndex` while presented, `0` otherwise. */
export function zIndexOf(state: SheetRegistryState, id: string): number {
	const entry = state.open.find((candidate) => candidate.id === id);
	return entry === undefined ? 0 : entry.z;
}

/** Whether `id` is the sheet on top of its own host — the one a back press should close. */
export function isTop(state: SheetRegistryState, id: string): boolean {
	const entry = state.open.find((candidate) => candidate.id === id);
	if (entry === undefined) return false;
	return topOf(state, entry.host) === id;
}
