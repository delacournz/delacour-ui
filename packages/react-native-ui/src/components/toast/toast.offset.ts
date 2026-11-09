/**
 * Per-edge sources that say how much of the screen edge app chrome covers —
 * a tab bar, a bottom toolbar, a custom header. The viewport lifts each stack
 * clear of the newest source for its edge.
 *
 * Generic over the source so this file stays pure: the app's store holds
 * Reanimated shared values (`toast-api.ts`), and the viewport reads them on the
 * UI thread. This store only keeps and orders them; it never reads one.
 */
export type ToastOffsetSources<T> = { top?: T; bottom?: T };

/** One caller's hold on the store. `update` swaps its sources in place; `release` drops them. */
export type ToastOffsetRegistration<T> = {
	update: (sources: ToastOffsetSources<T>) => void;
	release: () => void;
};

export type ToastOffsetStore<T> = {
	/** The newest source for each edge. The same object until a source changes. */
	getSnapshot: () => ToastOffsetSources<T>;
	subscribe: (listener: () => void) => () => void;
	/** Registers sources. The newest registration wins per edge; releasing it restores the one before. */
	set: (sources: ToastOffsetSources<T>) => ToastOffsetRegistration<T>;
};

type Entry<T> = { id: number; sources: ToastOffsetSources<T> };

/** The newest source for each edge, newest registration first. */
function resolveSources<T>(entries: readonly Entry<T>[]): ToastOffsetSources<T> {
	const resolved: ToastOffsetSources<T> = {};
	for (let index = entries.length - 1; index >= 0; index -= 1) {
		const entry = entries[index];
		if (!entry) continue;
		const { sources } = entry;
		if (resolved.top === undefined && sources.top !== undefined) resolved.top = sources.top;
		if (resolved.bottom === undefined && sources.bottom !== undefined) resolved.bottom = sources.bottom;
	}
	return resolved;
}

/**
 * A tiny external store for the viewport's edge offsets, read with
 * `useSyncExternalStore`.
 *
 * A stack, not one slot: a tab bar registers, a screen pushed over it registers
 * its own toolbar, and popping that screen restores the tab bar without either
 * knowing about the other.
 */
export function createToastOffsetStore<T>(): ToastOffsetStore<T> {
	let entries: Entry<T>[] = [];
	let snapshot: ToastOffsetSources<T> = {};
	let counter = 0;
	const listeners = new Set<() => void>();

	const commit = (next: Entry<T>[]): void => {
		entries = next;
		const resolved = resolveSources(entries);
		if (resolved.top === snapshot.top && resolved.bottom === snapshot.bottom) return;
		snapshot = resolved;
		for (const listener of listeners) listener();
	};

	return {
		getSnapshot: () => snapshot,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		set: (sources) => {
			counter += 1;
			const id = counter;
			commit([...entries, { id, sources }]);
			const isLive = (): boolean => entries.some((entry) => entry.id === id);
			return {
				update: (next) => {
					if (!isLive()) return;
					commit(entries.map((entry) => (entry.id === id ? { id, sources: next } : entry)));
				},
				release: () => {
					if (!isLive()) return;
					commit(entries.filter((entry) => entry.id !== id));
				},
			};
		},
	};
}

/**
 * How far a stack moves off its safe-area edge, in points.
 *
 * Chrome and the keyboard are both measured from the screen edge, and each
 * already covers the safe area, so only the part above the inset counts. They
 * do not add up: the keyboard draws over a tab bar, so the larger one wins.
 * A self-contained worklet — the viewport calls it from an animated style.
 */
export function resolveToastEdgeLift({
	chrome,
	safeArea,
	keyboard,
}: {
	chrome: number;
	safeArea: number;
	keyboard: number;
}): number {
	"worklet";
	const covered = Number.isFinite(chrome) && chrome > 0 ? chrome : 0;
	return Math.max(0, Math.max(covered, keyboard) - safeArea);
}
