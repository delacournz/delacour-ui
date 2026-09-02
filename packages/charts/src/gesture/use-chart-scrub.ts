import { useMemo } from "react";
import { makeMutable } from "react-native-reanimated";
import type { ChartScrubSeriesState, ChartScrubState } from "./gesture.types";

/**
 * Allocates the shared values a scrub writes to.
 *
 * `makeMutable` inside one `useMemo`, rather than a `useSharedValue` per
 * series: the series list is data, and calling a hook in a loop over it breaks
 * the rules of hooks the moment a series is added or removed.
 *
 * Hold the result and pass it to a chart. It stays stable for the life of the
 * component unless the set of keys changes.
 */
export function useChartScrub(keys: readonly string[]): ChartScrubState {
	const signature = keys.join(" ");

	// Keyed on the joined signature: a fresh array of the same keys must not
	// reallocate every shared value, which would strand the gesture writing to
	// values nothing renders any more.
	return useMemo<ChartScrubState>(() => {
		const series: Record<string, ChartScrubSeriesState> = {};
		for (const key of signature === "" ? [] : signature.split(" ")) {
			series[key] = {
				y: makeMutable(Number.NaN),
				snappedY: makeMutable(Number.NaN),
				value: makeMutable(Number.NaN),
			};
		}

		return {
			isActive: makeMutable(false),
			x: makeMutable(0),
			snappedX: makeMutable(Number.NaN),
			xValue: makeMutable(Number.NaN),
			index: makeMutable(-1),
			series,
		};
	}, [signature]);
}
