import type { SharedValue } from "react-native-reanimated";
import type { CurvePath } from "../core/interaction/path-segments";
import type { ScaleDescriptor } from "../core/scale/scale.types";

/**
 * What a scrub knows about one series.
 *
 * `snappedX`/`snappedY` are the canvas point of the nearest datum **on this
 * series**, whichever way the chart is oriented — a dot drawn at them sits on
 * the datum on a vertical chart and at the end of the bar on a horizontal
 * one. `x`/`y` are the gliding equivalent. A consumer that reads the pair
 * never has to know the orientation.
 */
export type ChartScrubSeriesState = {
	/**
	 * Canvas x of the glide point. On a vertical chart the touch x; on a
	 * horizontal one the same as `snappedX`, because the glide is disabled
	 * there — a bar has no curve to slide along.
	 */
	readonly x: SharedValue<number>;
	/**
	 * Canvas y **on the drawn curve** at the touched x.
	 *
	 * A dot bound to this glides continuously along the line. `NaN` inside a
	 * gap, where the series has no value. On a horizontal chart, the category's
	 * y — the same as `snappedY`.
	 */
	readonly y: SharedValue<number>;
	/** Canvas x of the nearest datum: the category's x when vertical, the value's x when horizontal. */
	readonly snappedX: SharedValue<number>;
	/** Canvas y of the nearest datum: the value's y when vertical, the category's y when horizontal. */
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
	/** Touch y in canvas points, clamped to the plot rect. */
	readonly y: SharedValue<number>;
	/**
	 * Canvas x of the nearest datum's category, on a vertical chart. `NaN` on
	 * a horizontal one, where the category has no x.
	 *
	 * What a crosshair should sit at whenever the readout beside it names a
	 * datum: a vertical line tracking the raw touch while the label snaps says
	 * two different things about one gesture.
	 */
	readonly snappedX: SharedValue<number>;
	/**
	 * Canvas y of the nearest datum's category, on a horizontal chart — where
	 * a band highlight `xStep.px` tall is centred. `NaN` on a vertical one.
	 */
	readonly snappedY: SharedValue<number>;
	/** The category value under the touch, whichever axis the categories lie on. */
	readonly xValue: SharedValue<number>;
	/** Nearest datum index. `-1` before the first touch. */
	readonly index: SharedValue<number>;
	readonly series: Readonly<Record<string, ChartScrubSeriesState>>;
};

/**
 * One series, as the scrub worklet needs it: plain numbers, nothing to call.
 *
 * `ys` are the canvas positions of each datum's value along the value axis —
 * a y when vertical, an x when horizontal. A stacked key's are its segment
 * tops, so the dot sits on the visible segment; `values` are always the raw
 * series, which is what a readout prints.
 */
export type ScrubSeries = {
	readonly key: string;
	readonly path: CurvePath;
	readonly ys: readonly (number | null)[];
	readonly values: readonly (number | null)[];
};

/**
 * Everything the scrub worklet reads, in one shared value.
 *
 * `axis` is the canvas axis the categories lie on, and `positions` and
 * `scale` describe them there. `xPositions` and `xScale` are the same two
 * under their older names, kept for a consumer that built against them.
 */
export type ScrubModel = {
	/** The canvas axis the categories lie on: `x` when vertical, `y` when horizontal. */
	readonly axis: "x" | "y";
	readonly left: number;
	readonly right: number;
	readonly top: number;
	readonly bottom: number;
	/** Canvas position of each row's category along `axis`, ascending. */
	readonly positions: readonly number[];
	/** The category scale, for inverting a touch to a category value. */
	readonly scale: ScaleDescriptor;
	/** Same as `positions`. */
	readonly xPositions: readonly number[];
	/** Same as `scale`. */
	readonly xScale: ScaleDescriptor;
	readonly series: readonly ScrubSeries[];
};

export const EMPTY_SCRUB_MODEL: ScrubModel = {
	axis: "x",
	left: 0,
	right: 0,
	top: 0,
	bottom: 0,
	positions: [],
	scale: { kind: "linear", domain: [0, 1], range: [0, 1] },
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
