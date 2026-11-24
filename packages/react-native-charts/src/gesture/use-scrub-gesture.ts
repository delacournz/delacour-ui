import { useMemo } from "react";
import { type ComposedGesture, type PanGesture, type SingleGesture, usePanGesture } from "react-native-gesture-handler";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { closestIndex } from "../core/interaction/closest-index";
import { getYForX } from "../core/interaction/y-for-x";
import { invertValue } from "../core/scale/scale";
import { clamp } from "../core/util/clamp";
import { readAt } from "../core/util/read-at";
import type { ChartScrubState, ScrubConfig, ScrubModel, ScrubSeries } from "./gesture.types";

const DEFAULT_HOLD_MS = 250;
const DEFAULT_ACTIVATION_DISTANCE = 8;

export type UseScrubGestureOptions = {
	readonly state: ChartScrubState | undefined;
	readonly model: SharedValue<ScrubModel>;
	readonly config?: ScrubConfig;
	/** The scrollable's gesture to out-prioritise, for `behaviour: "block"`. */
	readonly blocks?: SingleGesture | ComposedGesture;
};

/**
 * The pan that drives a scrub.
 *
 * Everything happens on the UI thread. The touch x is clamped to the plot
 * rect, inverted through the scale descriptor to a domain value, matched to
 * the nearest datum, and solved against the drawn curve — with no hop to
 * JavaScript, which is what lets the dot keep up with a fast drag.
 *
 * On a horizontal chart the touch **y** is the one that matters: it is
 * clamped, inverted against the category scale and matched to a row, and the
 * series' value positions come back as canvas x. The glide is off there —
 * a bar has no curve to slide along — so every series reports its snapped
 * point twice.
 *
 * The handlers close over `apply`, a hook-scope worklet that reaches
 * `closestIndex`, `getYForX`, `invertValue` and `clamp` in the ordinary way.
 * See the package AGENTS.md: that is legal precisely because these are not
 * module-scope worklets.
 *
 * The pan hook runs on every render — the rules of hooks allow no early return —
 * so a chart with nothing to scrub still holds one, disabled, and `null` is
 * returned in its place so no overlay is mounted for it.
 */
export function useScrubGesture(options: UseScrubGestureOptions): PanGesture | null {
	const { state, model, config, blocks } = options;
	const enabled = (config?.enabled ?? true) && state !== undefined;
	const behaviour = config?.behaviour ?? "hold";
	const holdDuration = config?.holdDuration ?? DEFAULT_HOLD_MS;
	const activationDistance = config?.activationDistance ?? DEFAULT_ACTIVATION_DISTANCE;

	const apply = useScrubApply(state, model);

	// Only the options the behaviour names. `activateAfterLongPress`, the offsets
	// and `block` each change how the pan activates, so the others are left
	// `undefined`, which Gesture Handler drops before the config reaches native.
	// One literal rather than a spread: the Worklets plugin rejects a spread in a
	// gesture hook's config.
	const claimOffset: [number, number] = [-activationDistance, activationDistance];
	const isClaim = behaviour === "claim";

	const pan = usePanGesture({
		activateAfterLongPress: behaviour === "hold" ? holdDuration : undefined,
		activeOffsetX: isClaim ? claimOffset : undefined,
		failOffsetY: isClaim ? claimOffset : undefined,
		block: behaviour === "block" ? blocks : undefined,
		enabled: enabled && apply !== null,
		averageTouches: true,
		// A finger dragged above or below the plot keeps scrubbing. Cancelling
		// there strands the dot mid-gesture for anyone whose thumb drifts.
		shouldCancelWhenOutside: false,
		onActivate: (event) => {
			"worklet";
			if (state === undefined || apply === null) return;
			// A touch takes over from a focus request, and clearing it lets the
			// same datum be asked for again once the finger lifts.
			state.focus.value = -1;
			state.isActive.value = true;
			apply(event.x, event.y);
		},
		onUpdate: (event) => {
			"worklet";
			if (apply === null) return;
			apply(event.x, event.y);
		},
		// onFinalize, never onDeactivate alone: it is the one callback that runs
		// on every path out of the gesture, so the dot is never stranded on screen
		// until the next touch.
		onFinalize: () => {
			"worklet";
			if (state === undefined) return;
			state.isActive.value = false;
		},
	});

	return state === undefined || apply === null ? null : pan;
}

/**
 * Answers `state.focus`: moves the scrub to a datum by index, with no touch.
 *
 * This is how a screen reader's increment and decrement drive the same
 * tooltip and cursor a finger does. The write is what a touch landing exactly
 * on that datum's category would make — the category position, the domain
 * value, the index, and every series through the same per-series writer the
 * pan uses — so nothing downstream can tell the two apart. `-1`, an index
 * past the data, or a collapsed plot asks for nothing.
 */
export function useScrubFocus(state: ChartScrubState | undefined, model: SharedValue<ScrubModel>): void {
	const applySeries = useApplySeries(state);
	const apply = useMemo(() => {
		if (state === undefined || applySeries === null) return null;
		// The datum's category position, or `NaN` when there is nothing to move to.
		const categoryAt = (current: ScrubModel, index: number): number => {
			"worklet";
			if (Math.min(current.right - current.left, current.bottom - current.top) <= 0) return Number.NaN;
			if (index < 0 || index >= current.positions.length) return Number.NaN;
			return readAt(current.positions, index);
		};

		// Where a finger would rest on a horizontal chart, whose tooltip reads the
		// touch x: the first series' value end, so the readout sits by its bar.
		const valueEndAt = (current: ScrubModel, index: number): number => {
			"worklet";
			const first = current.series[0];
			return first === undefined ? current.left : readAt(first.ys, index);
		};

		return (index: number): void => {
			"worklet";
			const current = model.value;
			const category = categoryAt(current, index);
			if (!Number.isFinite(category)) return;

			const horizontal = current.axis === "y";
			if (horizontal) {
				state.x.value = valueEndAt(current, index);
				state.y.value = category;
			} else state.x.value = category;
			state.xValue.value = invertValue(current.scale, category);
			state.index.value = index;
			state.snappedX.value = horizontal ? Number.NaN : category;
			state.snappedY.value = horizontal ? category : Number.NaN;
			state.isActive.value = true;

			for (const series of current.series) applySeries(series, index, category, category, horizontal);
		};
	}, [state, model, applySeries]);

	useAnimatedReaction(
		() => (state === undefined ? -1 : state.focus.value),
		(next, previous) => {
			if (apply === null || next < 0 || next === previous) return;
			apply(next);
		},
		[apply]
	);
}

type ScrubApply = (touchX: number, touchY: number) => void;

/**
 * The worklet that turns a touch into every scrub value.
 *
 * Built in its own `useMemo` so it closes over `closestIndex`, `getYForX`,
 * `invertValue` and `clamp` in the ordinary way — a hook-scope worklet, which
 * the flat-worklet rule permits — and so the pan above stays small enough to
 * read.
 */
function useScrubApply(state: ChartScrubState | undefined, model: SharedValue<ScrubModel>): ScrubApply | null {
	const applySeries = useApplySeries(state);
	return useMemo(() => {
		if (state === undefined || applySeries === null) return null;

		return (touchX: number, touchY: number): void => {
			"worklet";
			const current = model.value;
			// A collapsed plot has nothing to scrub, and would clamp into a NaN.
			if (Math.min(current.right - current.left, current.bottom - current.top) <= 0) return;

			const x = clamp(touchX, current.left, current.right);
			const y = clamp(touchY, current.top, current.bottom);
			state.x.value = x;
			state.y.value = y;

			const horizontal = current.axis === "y";
			const along = horizontal ? y : x;
			state.xValue.value = invertValue(current.scale, along);

			const index = closestIndex(current.positions, along);
			state.index.value = index;
			const category = readAt(current.positions, index);
			state.snappedX.value = horizontal ? Number.NaN : category;
			state.snappedY.value = horizontal ? category : Number.NaN;

			for (const series of current.series) applySeries(series, index, category, x, horizontal);
		};
	}, [state, model, applySeries]);
}

type ApplySeries = (series: ScrubSeries, index: number, category: number, x: number, horizontal: boolean) => void;

/** The per-series half of the scrub, as a hook-scope worklet of its own. */
function useApplySeries(state: ChartScrubState | undefined): ApplySeries | null {
	return useMemo(() => {
		if (state === undefined) return null;

		// No glide on a horizontal chart — a bar has no curve to slide along —
		// so the snapped point is reported twice there.
		return (series: ScrubSeries, index: number, category: number, x: number, horizontal: boolean): void => {
			"worklet";
			const target = state.series[series.key];
			if (target === undefined) return;

			const snapped = readAt(series.ys, index);
			target.value.value = readAt(series.values, index);
			if (horizontal) {
				target.snappedX.value = snapped;
				target.snappedY.value = category;
				target.x.value = snapped;
				target.y.value = category;
				return;
			}
			target.snappedX.value = category;
			target.snappedY.value = snapped;
			target.x.value = x;
			// Inside a gap the curve has no y, so the dot falls back to the nearest
			// datum rather than vanishing to NaN mid-drag.
			const onCurve = getYForX(series.path, x);
			target.y.value = Number.isFinite(onCurve) ? onCurve : snapped;
		};
	}, [state]);
}
