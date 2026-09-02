import type { SharedValue } from "react-native-reanimated";
import type { CurvePath } from "../core/interaction/path-segments";
import type { ScaleDescriptor } from "../core/scale/scale.types";

/** What a scrub knows about one series. */
export type ChartScrubSeriesState = {
	/**
	 * Canvas y **on the drawn curve** at the touched x.
	 *
	 * A dot bound to this glides continuously along the line. `NaN` inside a
	 * gap, where the series has no value.
	 */
	readonly y: SharedValue<number>;
	/** Canvas y of the nearest datum — a dot bound to this snaps to data. */
	readonly snappedY: SharedValue<number>;
	/** The nearest datum's value in domain units, which is what a label prints. */
	readonly value: SharedValue<number>;
};

/**
 * The scrub, as shared values.
 *
 * Every field holds a `number` or a `boolean` — never an `SkPath`, never an
 * object. That is deliberate: it keeps a consumer's tooltip free of any Skia
 * import and readable from a plain `useAnimatedStyle` on an ordinary React
 * Native view.
 */
export type ChartScrubState = {
	readonly isActive: SharedValue<boolean>;
	/** Touch x in canvas points, clamped to the plot rect. */
	readonly x: SharedValue<number>;
	/**
	 * Canvas x of the nearest datum.
	 *
	 * What a crosshair should sit at whenever the readout beside it names a
	 * datum: a vertical line tracking the raw touch while the label snaps says
	 * two different things about one gesture.
	 */
	readonly snappedX: SharedValue<number>;
	/** The domain value under the touch. */
	readonly xValue: SharedValue<number>;
	/** Nearest datum index. `-1` before the first touch. */
	readonly index: SharedValue<number>;
	readonly series: Readonly<Record<string, ChartScrubSeriesState>>;
};

/** One series, as the scrub worklet needs it: plain numbers, nothing to call. */
export type ScrubSeries = {
	readonly key: string;
	readonly path: CurvePath;
	readonly ys: readonly (number | null)[];
	readonly values: readonly (number | null)[];
};

/** Everything the scrub worklet reads, in one shared value. */
export type ScrubModel = {
	readonly left: number;
	readonly right: number;
	readonly xPositions: readonly number[];
	readonly xScale: ScaleDescriptor;
	readonly series: readonly ScrubSeries[];
};

export const EMPTY_SCRUB_MODEL: ScrubModel = {
	left: 0,
	right: 0,
	xPositions: [],
	xScale: { kind: "linear", domain: [0, 1], range: [0, 1] },
	series: [],
};

/**
 * How the scrub coexists with a scrolling parent.
 *
 * - `hold` activates after a long press, so a list keeps both axes until the
 *   user deliberately holds. The right default for a chart inside a feed.
 * - `claim` gives horizontal drags to the scrub and vertical ones to the
 *   scroll. For a chart that owns its width.
 * - `block` wins outright, and needs the scrollable's gesture to block.
 */
export type ScrubBehaviour = "hold" | "claim" | "block";

export type ScrubConfig = {
	readonly enabled?: boolean;
	readonly behaviour?: ScrubBehaviour;
	/** Milliseconds to hold before `hold` activates. */
	readonly holdDuration?: number;
	/** How far a drag must travel before `claim` decides it is horizontal. */
	readonly activationDistance?: number;
};
