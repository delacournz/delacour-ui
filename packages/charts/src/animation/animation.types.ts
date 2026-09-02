import type { WithSpringConfig, WithTimingConfig } from "react-native-reanimated";

/**
 * How a mark moves when its data changes.
 *
 * `none` is not the same as a zero duration: it skips the interpolation
 * entirely, which is what a chart re-rendering sixty times a second off a live
 * feed wants — there is nothing to animate towards when the target moves every
 * frame.
 */
export type ChartAnimation =
	| { readonly type: "none" }
	| ({ readonly type: "timing" } & WithTimingConfig)
	| ({ readonly type: "spring" } & WithSpringConfig);

export const DEFAULT_CHART_ANIMATION: ChartAnimation = { type: "timing", duration: 300 };
