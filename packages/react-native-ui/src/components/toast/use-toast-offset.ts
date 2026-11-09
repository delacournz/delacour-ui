import { useEffect, useRef } from "react";
import {
	Easing,
	isSharedValue,
	type SharedValue,
	useAnimatedReaction,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { ToastOffsetRegistration, ToastOffsetSources, ToastOffsetStore } from "./toast.offset";
import { toastOffsetStore } from "./toast-api";

/** How long an offset takes to reach a new value — the same as a stack's depth change. */
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

/**
 * Where the hook's own value for one edge goes next, or `null` to leave the
 * edge out. `null` keeps an edge this hook already showed and sends it home; a
 * shared value starts from where it is now; a number is the target.
 */
function planEdge(value: ToastOffsetValue | undefined, isCleared: boolean, wasRegistered: boolean): number | null {
	if (isCleared) return wasRegistered ? 0 : null;
	if (isSharedValue<number>(value)) return value.value;
	if (typeof value !== "number") return null;
	return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Follows `source` on the UI thread while `isFollowing` is true, writing each
 * change straight into `own`. No deps array: Reanimated 4 ignores one on native
 * and warns, and the worklet already closes over the current `source`.
 */
function useFollow(
	source: SharedValue<number> | null,
	own: SharedValue<number>,
	isFollowing: SharedValue<boolean>
): void {
	useAnimatedReaction(
		() => (source ? source.value : null),
		(next, previous) => {
			if (next === null || !isFollowing.value || next === previous) return;
			own.value = next;
		}
	);
}

/**
 * Tells the toast viewport how much of a screen edge app chrome covers while
 * this component is mounted, so toasts sit clear of it.
 *
 * Measured from the screen edge, like a tab bar's layout height: the viewport
 * subtracts the safe area itself, and the keyboard wins when it is taller.
 *
 * - A number animates the viewport to it, and re-animates on every change.
 * - A shared value is followed on the UI thread: write it (`.set()`) from an
 *   `onLayout`, a scroll handler or a `withTiming`, and the toasts follow with
 *   no re-render.
 * - `null` slides each edge the hook showed back to 0, numeric or followed,
 *   but keeps the registration, so a tab bar that loses focus lets the toasts
 *   down instead of snapping them. Unmounting drops the registration.
 *
 * The hook registers shared values of its own and moves them, so switching
 * between a number, a shared value and `null` always animates. The newest
 * mounted caller wins per edge; when it goes, the one before it applies again.
 *
 * @example
 * // A tab bar lifts toasts only while its screen is focused, with no re-render on layout.
 * const isFocused = useIsFocused();
 * const height = useSharedValue(0);
 * useToastOffset(isFocused ? { bottom: height } : null);
 * return <View onLayout={(event) => height.set(event.nativeEvent.layout.height)}>…</View>;
 */
export function useToastOffset(
	offset: ToastOffset | null,
	{ store = toastOffsetStore }: UseToastOffsetOptions = {}
): void {
	const isReduced = useReducedMotion();
	const top = useSharedValue(0);
	const bottom = useSharedValue(0);
	const isFollowingTop = useSharedValue(false);
	const isFollowingBottom = useSharedValue(false);
	const registration = useRef<{
		store: ToastOffsetStore<SharedValue<number>>;
		handle: ToastOffsetRegistration<SharedValue<number>>;
	} | null>(null);
	const registered = useRef<ToastOffsetSources<SharedValue<number>>>({});

	const topValue = offset?.top;
	const bottomValue = offset?.bottom;
	const topSource = isSharedValue<number>(topValue) ? topValue : null;
	const bottomSource = isSharedValue<number>(bottomValue) ? bottomValue : null;
	const isCleared = offset === null;

	useFollow(topSource, top, isFollowingTop);
	useFollow(bottomSource, bottom, isFollowingBottom);

	useEffect(() => {
		const handle = store.set({});
		registration.current = { store, handle };
		return () => {
			handle.release();
			registration.current = null;
			registered.current = {};
		};
	}, [store]);

	// Runs after the registration above, in the same commit, so a new store is
	// written to as soon as it is registered with.
	useEffect(() => {
		const current = registration.current;
		if (current?.store !== store) return;
		const own: Record<Edge, SharedValue<number>> = { top, bottom };
		const following: Record<Edge, SharedValue<boolean>> = { top: isFollowingTop, bottom: isFollowingBottom };
		const values: Record<Edge, ToastOffsetValue | undefined> = { top: topValue, bottom: bottomValue };
		const next: ToastOffsetSources<SharedValue<number>> = {};

		for (const edge of EDGES) {
			const wasRegistered = registered.current[edge] === own[edge];
			const target = planEdge(values[edge], isCleared, wasRegistered);
			following[edge].value = !isCleared && isSharedValue(values[edge]);
			if (target === null) continue;
			next[edge] = own[edge];
			// A source that only just applied starts where it is going, so a first
			// value does not slide in from 0. Following resumes on the source's next
			// change, so a source moving mid-slide takes over from there.
			own[edge].value =
				isReduced || !wasRegistered ? target : withTiming(target, { duration: OFFSET_MS, easing: OFFSET_EASING });
		}

		registered.current = next;
		current.handle.update(next);
	}, [store, top, bottom, isFollowingTop, isFollowingBottom, topValue, bottomValue, isCleared, isReduced]);
}
