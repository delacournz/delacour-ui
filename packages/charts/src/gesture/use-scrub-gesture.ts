import { useMemo } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { closestIndex } from "../core/interaction/closest-index";
import { getYForX } from "../core/interaction/y-for-x";
import { invertValue } from "../core/scale/scale";
import { clamp } from "../core/util/clamp";
import type { ChartScrubState, ScrubConfig, ScrubModel, ScrubSeries } from "./gesture.types";

const DEFAULT_HOLD_MS = 250;
const DEFAULT_ACTIVATION_DISTANCE = 8;

export type UseScrubGestureOptions = {
	readonly state: ChartScrubState | undefined;
	readonly model: SharedValue<ScrubModel>;
	readonly config?: ScrubConfig;
	/** The scrollable's gesture to out-prioritise, for `behaviour: "block"`. */
	readonly blocks?: GestureType;
};

/**
 * The pan that drives a scrub.
 *
 * Everything happens on the UI thread. The touch x is clamped to the plot
 * rect, inverted through the scale descriptor to a domain value, matched to
 * the nearest datum, and solved against the drawn curve — with no hop to
 * JavaScript, which is what lets the dot keep up with a fast drag.
 *
 * The handlers are built inside this `useMemo`, so they close over
 * `closestIndex`, `getYForX`, `invertValue` and `clamp` in the ordinary way.
 * See the package AGENTS.md: that is legal precisely because these are not
 * module-scope worklets.
 */
export function useScrubGesture(options: UseScrubGestureOptions): GestureType | null {
	const { state, model, config, blocks } = options;
	const enabled = (config?.enabled ?? true) && state !== undefined;
	const behaviour = config?.behaviour ?? "hold";
	const holdDuration = config?.holdDuration ?? DEFAULT_HOLD_MS;
	const activationDistance = config?.activationDistance ?? DEFAULT_ACTIVATION_DISTANCE;

	return useMemo(() => {
		if (state === undefined) return null;

		const applySeries = (series: ScrubSeries, x: number, index: number): void => {
			"worklet";
			const target = state.series[series.key];
			if (target === undefined) return;

			const snapped = index >= 0 ? (series.ys[index] ?? Number.NaN) : Number.NaN;
			const onCurve = getYForX(series.path, x);

			target.snappedY.value = snapped;
			// Inside a gap the curve has no y, so the dot falls back to the nearest
			// datum rather than vanishing to NaN mid-drag.
			target.y.value = Number.isFinite(onCurve) ? onCurve : snapped;
			target.value.value = index >= 0 ? (series.values[index] ?? Number.NaN) : Number.NaN;
		};

		const apply = (touchX: number): void => {
			"worklet";
			const current = model.value;
			if (current.right <= current.left) return;

			const x = clamp(touchX, current.left, current.right);
			state.x.value = x;
			state.xValue.value = invertValue(current.xScale, x);

			const index = closestIndex(current.xPositions, x);
			state.index.value = index;

			for (let position = 0; position < current.series.length; position += 1) {
				const series = current.series[position];
				if (series !== undefined) applySeries(series, x, index);
			}
		};

		const finish = (): void => {
			"worklet";
			state.isActive.value = false;
		};

		let pan = Gesture.Pan()
			.enabled(enabled)
			.averageTouches(true)
			// A finger dragged above or below the plot keeps scrubbing. Cancelling
			// there strands the dot mid-gesture for anyone whose thumb drifts.
			.shouldCancelWhenOutside(false)
			.onStart((event) => {
				"worklet";
				state.isActive.value = true;
				apply(event.x);
			})
			.onUpdate((event) => {
				"worklet";
				apply(event.x);
			})
			// onFinalize, never onEnd: a gesture that fails after activating never
			// fires onEnd, and the dot is stranded on screen until the next touch.
			.onFinalize(finish);

		if (behaviour === "hold") pan = pan.activateAfterLongPress(holdDuration);
		if (behaviour === "claim") {
			pan = pan
				.activeOffsetX([-activationDistance, activationDistance])
				.failOffsetY([-activationDistance, activationDistance]);
		}
		if (behaviour === "block" && blocks !== undefined) pan = pan.blocksExternalGesture(blocks);

		return pan;
	}, [state, model, enabled, behaviour, holdDuration, activationDistance, blocks]);
}
