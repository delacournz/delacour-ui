import { makeMutable, type SharedValue } from "react-native-reanimated";
import type { FlowHandlePlacement, FlowHandleType, FlowPoint, FlowSide, FlowSize } from "./flow-geometry";

export type FlowRegistryHandle = {
	id: string;
	side: FlowSide;
	offset: number;
	type: FlowHandleType;
	label?: string;
};

/** What the JS thread knows about an entry. Written by the entry's own component, in effects. */
export type FlowRegistryMeta = {
	kind: "node" | "group";
	label: string;
	groupId?: string;
	/** Moves with its group's drag. */
	ridesGroup: boolean;
	/** Clamped to its group's rect when dragged. */
	isConfined: boolean;
	handles: FlowRegistryHandle[];
	isMounted: boolean;
	/**
	 * Has laid out at least once. Deliberately not cleared on unmount: a remount (Fast Refresh, a
	 * strict-mode double effect) re-runs the effects but not `onLayout`, so clearing it would leave
	 * the node unhittable for connections and keep `fitViewOnMount` waiting forever.
	 */
	isMeasured: boolean;
	/**
	 * The JS thread's copy of `size`. A shared value written on the JS thread reads back stale
	 * until the UI thread has applied it, so a fit run straight after a layout would see zero.
	 */
	size: FlowSize;
};

/**
 * One node or group. The shared values are the UI thread's copy — a drag writes them with no React
 * render, and every edge reading them routes itself on the same frame.
 */
export type FlowRegistryEntry = {
	id: string;
	position: SharedValue<FlowPoint>;
	size: SharedValue<FlowSize>;
	/** Each handle's placement, keyed by id, for edges routing on the UI thread. */
	handles: SharedValue<Record<string, FlowHandlePlacement>>;
	meta: FlowRegistryMeta;
};

/** An immutable picture of the mounted entries, rebuilt on every change so React sees one. */
export type FlowSnapshotEntry = Readonly<{
	id: string;
	kind: FlowRegistryMeta["kind"];
	label: string;
	groupId?: string;
	ridesGroup: boolean;
	handles: readonly FlowRegistryHandle[];
	entry: FlowRegistryEntry;
}>;

export type FlowRegistry = {
	/** The entry for `id`, created on first ask — an edge may render before the node it names. */
	ensure: (id: string) => FlowRegistryEntry;
	/** Mounted entries, groups first so they draw beneath their nodes in the minimap. */
	snapshot: () => FlowSnapshotEntry[];
};

/**
 * The canvas's index of nodes and groups.
 *
 * **Entries are created on demand, not on mount.** An edge reads both ends' shared values during
 * its first render, and React renders children in order, so an edge listed before its nodes would
 * otherwise find nothing. `ensure` makes the entry whoever asks first; the node fills it in when
 * it mounts. An entry that never mounts has a zero size, and an edge to it draws nothing.
 */
export function createFlowRegistry(): FlowRegistry {
	const entries = new Map<string, FlowRegistryEntry>();

	return {
		ensure(id) {
			const existing = entries.get(id);
			if (existing) return existing;
			const entry: FlowRegistryEntry = {
				handles: makeMutable<Record<string, FlowHandlePlacement>>({}),
				id,
				meta: {
					handles: [],
					isConfined: false,
					isMeasured: false,
					isMounted: false,
					kind: "node",
					label: id,
					ridesGroup: true,
					size: { height: 0, width: 0 },
				},
				position: makeMutable<FlowPoint>({ x: 0, y: 0 }),
				size: makeMutable<FlowSize>({ height: 0, width: 0 }),
			};
			entries.set(id, entry);
			return entry;
		},
		snapshot() {
			const mounted = [...entries.values()].filter((entry) => entry.meta.isMounted);
			mounted.sort((a, b) => (a.meta.kind === b.meta.kind ? 0 : a.meta.kind === "group" ? -1 : 1));
			return mounted.map((entry) => ({
				entry,
				groupId: entry.meta.groupId,
				handles: [...entry.meta.handles],
				id: entry.id,
				kind: entry.meta.kind,
				label: entry.meta.label,
				ridesGroup: entry.meta.ridesGroup,
			}));
		},
	};
}
