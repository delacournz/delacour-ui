/**
 * A debouncer with its clock injected, so every rule below is reachable from
 * `bun test` with a fake one and no real timer.
 *
 * `H` is whatever the scheduler hands back — `ReturnType<typeof setTimeout>` in
 * the component, a plain number in the test.
 */
export type DebouncerOptions<T, H> = {
	/** Milliseconds after the last change. `0` (or less) fires synchronously. */
	delay: number;
	/** Called with the value that settled. */
	onFire: (value: T) => void;
	schedule: (run: () => void, delay: number) => H;
	cancelSchedule: (handle: H) => void;
};

export type Debouncer<T> = {
	/** A new value: restarts the wait, and fires at once when the delay is 0. */
	push: (value: T) => void;
	/** Fires the pending value now, if there is one. The search key's path. */
	flush: () => void;
	/** Drops the pending value without firing it. */
	cancel: () => void;
	/** Drops anything pending and fires `value` now. Clear's and Cancel's path. */
	fireNow: (value: T) => void;
	isPending: () => boolean;
};

type Pending<T, H> = { kind: "idle" } | { kind: "waiting"; value: T; handle: H };

/**
 * Debounces a stream of values: the last one fires once, `delay` ms after the
 * stream goes quiet.
 *
 * A pure state machine rather than a hook, so the timing is tested exactly —
 * a hook would need a renderer and a real clock, and this package's tests have
 * neither. `SearchBar` wraps it with `setTimeout` and keeps one per mount.
 */
export function createDebouncer<T, H>({
	delay,
	onFire,
	schedule,
	cancelSchedule,
}: DebouncerOptions<T, H>): Debouncer<T> {
	let pending: Pending<T, H> = { kind: "idle" };

	const cancel = () => {
		if (pending.kind === "waiting") cancelSchedule(pending.handle);
		pending = { kind: "idle" };
	};

	const fireNow = (value: T) => {
		cancel();
		onFire(value);
	};

	const push = (value: T) => {
		if (delay <= 0) {
			fireNow(value);
			return;
		}
		cancel();
		const handle = schedule(() => {
			pending = { kind: "idle" };
			onFire(value);
		}, delay);
		pending = { handle, kind: "waiting", value };
	};

	const flush = () => {
		if (pending.kind === "idle") return;
		fireNow(pending.value);
	};

	return { cancel, fireNow, flush, isPending: () => pending.kind === "waiting", push };
}
