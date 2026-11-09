import { useEffect, useRef } from "react";
import {
	Easing,
	isSharedValue,
	type SharedValue,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { ToastOffsetRegistration, ToastOffsetSources, ToastOffsetStore } from "./toast.offset";
import { toastOffsetStore } from "./toast-api";

/** How long a numeric offset takes to reach a new value — the same as a stack's depth change. */
const OFFSET_MS = 220;
const OFFSET_EASING = Easing.out(Easing.cubic);

/** Points of one screen edge covered by app chrome: a number to animate to, or a shared value you drive. */
export type ToastOffsetValue = number | SharedValue<number>;

/** The chrome on each edge. An edge left out keeps whatever an older registration says. */
export type ToastOffset = { top?: ToastOffsetValue; bottom?: ToastOffsetValue };

export type UseToastOffsetOptions = {
	/** The store to write to. Default: the one `ToastViewport` reads. */
	store?: ToastOffsetStore<SharedValue<number>>;
};

type Edge = keyof ToastOffset;
const EDGES: readonly Edge[] = ["top", "bottom"];

/** What one edge registers, and the number to move the hook's own shared value to, if any. */
type EdgePlan = { source?: SharedValue<number>; target: number | null };

/**
 * Decides one edge: a caller's shared value is registered as is; a number
 * registers the hook's own shared value and moves it there; `null` keeps an
 * edge this hook was animating and sends it home to 0.
 */
function planEdge(
	value: ToastOffsetValue | undefined,
	own: SharedValue<number>,
	current: SharedValue<number> | undefined,
	isCleared: boolean
): EdgePlan {
	if (isCleared) return current === own ? { source: own, target: 0 } : { target: null };
	if (isSharedValue<number>(value)) return { source: value, target: null };
	if (typeof value === "number") return { source: own, target: Number.isFinite(value) ? Math.max(0, value) : 0 };
	return { target: null };
}

/**
 * Tells the toast viewport how much of a screen edge app chrome covers while
 * this component is mounted, so toasts sit clear of it.
 *
 * Measured from the screen edge, like a tab bar's layout height: the viewport
 * subtracts the safe area itself, and the keyboard wins when it is taller.
 *
 * - A number animates the viewport to it, and re-animates on every change.
 * - A shared value is read on the UI thread every frame — drive it with
 *   `withTiming` or a scroll handler and the toasts follow with no re-render.
 * - `null` animates every numeric edge back to 0 and drops every shared value,
 *   but keeps the registration, so a tab bar that loses focus slides the toasts
 *   down instead of snapping them. Unmounting drops the registration.
 *
 * The newest mounted caller wins per edge; when it goes, the one before it
 * applies again.
 *
 * @example
 * // A tab bar lifts toasts only while its screen is focused.
 * const isFocused = useIsFocused();
 * const [height, setHeight] = useState(0);
 * useToastOffset(isFocused ? { bottom: height } : null);
 * return <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>…</View>;
 *
 * @example
 * // A bar that hides on scroll drives its own shared value.
 * const barOffset = useSharedValue(84);
 * useToastOffset({ bottom: barOffset });
 */
export function useToastOffset(
	offset: ToastOffset | null,
	{ store = toastOffsetStore }: UseToastOffsetOptions = {}
): void {
	const isReduced = useReducedMotion();
	const top = useSharedValue(0);
	const bottom = useSharedValue(0);
	const registration = useRef<{
		store: ToastOffsetStore<SharedValue<number>>;
		handle: ToastOffsetRegistration<SharedValue<number>>;
	} | null>(null);
	const registered = useRef<ToastOffsetSources<SharedValue<number>>>({});

	useEffect(() => {
		const handle = store.set({});
		registration.current = { store, handle };
		return () => {
			handle.release();
			registration.current = null;
			registered.current = {};
		};
	}, [store]);

	const topValue = offset?.top;
	const bottomValue = offset?.bottom;
	const isCleared = offset === null;

	// Runs after the registration above, in the same commit, so a new store is
	// written to as soon as it is registered with.
	useEffect(() => {
		const current = registration.current;
		if (current?.store !== store) return;
		const internal: Record<Edge, SharedValue<number>> = { top, bottom };
		const values: Record<Edge, ToastOffsetValue | undefined> = { top: topValue, bottom: bottomValue };
		const next: ToastOffsetSources<SharedValue<number>> = {};

		for (const edge of EDGES) {
			const own = internal[edge];
			const { source, target } = planEdge(values[edge], own, registered.current[edge], isCleared);
			if (source) next[edge] = source;
			if (target === null) continue;
			// A source that only just applied starts where it is going, so a first
			// measurement does not slide in from 0.
			const isFresh = registered.current[edge] !== own;
			own.value = isReduced || isFresh ? target : withTiming(target, { duration: OFFSET_MS, easing: OFFSET_EASING });
		}

		registered.current = next;
		current.handle.update(next);
	}, [store, top, bottom, topValue, bottomValue, isCleared, isReduced]);
}
