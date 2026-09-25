import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { type ProgressContextValue, ProgressProvider, type ProgressRenderProps } from "../progress";
import {
	formatProgressValue,
	progressRatio,
	progressVariants,
	resolveProgressAccessibility,
} from "../progress/progress.variants";
import { type MeterContextValue, MeterProvider } from "./meter.context";
import type { MeterRenderProps } from "./meter.types";
import {
	litSegments,
	METER_MAX_VALUE,
	METER_MIN_VALUE,
	type MeterColor,
	type MeterSize,
	type MeterThreshold,
	type MeterValueLabel,
	meterRange,
	meterSegmentCount,
	meterValue,
	resolveMeterAxes,
	resolveMeterColor,
	resolveMeterScale,
	resolveMeterValueLabel,
} from "./meter.variants";
import { MeterFill } from "./meter-fill";
import { MeterHeader } from "./meter-header";
import { MeterLabel } from "./meter-label";
import { MeterOutput } from "./meter-output";
import { MeterSegments } from "./meter-segments";
import { MeterTrack } from "./meter-track";

type MeterBaseProps = Omit<ViewProps, "children"> & {
	/** The reading. Outside the scale it clamps to the nearer end; `NaN` reads at the floor. */
	value: number;
	/** The bottom of the scale — where the meter reads empty. */
	minValue?: number;
	/** The top of the scale — where the meter reads full. */
	maxValue?: number;
	/**
	 * Passed to `Intl.NumberFormat` by `Meter.Output` and the spoken value. With
	 * none, or a `percent` style, the readout is the share of the scale; any other
	 * style formats the reading itself — `168 GB`.
	 */
	formatOptions?: Intl.NumberFormatOptions;
	/**
	 * Replaces the formatted readout, on screen and to assistive technology — `Strong`, `Almost full`.
	 * A function is handed the judged reading, which is how a region is put into words a screen reader hears.
	 */
	valueLabel?: MeterValueLabel;
	/** The fill's colour on a plain scale, and below every threshold. Ignored when judging by regions. */
	color?: MeterColor;
	size?: MeterSize;
	/** Draw the scale as this many whole blocks instead of one continuous bar. */
	segments?: number;
	/** The anatomy. With none, the meter draws a bare track and fill, or its blocks. */
	children?: ReactNode;
};

/** Judge the reading by where it falls against a preferred end or band. */
type MeterRegionProps = {
	/** Below this is the low part of the scale. Defaults to `minValue`. */
	low?: number;
	/** Above this is the high part of the scale. Defaults to `maxValue`. */
	high?: number;
	/** The best reading. Below `low` means low is good; above `high` means high is good; between, the band is. */
	optimum?: number;
	thresholds?: never;
};

/** Judge the reading by explicit colour changes along the scale. */
type MeterThresholdProps = {
	/** Points where the colour changes, `{ from, color }`, in the reading's own units. The highest reached wins. */
	thresholds: readonly MeterThreshold[];
	low?: never;
	high?: never;
	optimum?: never;
};

/**
 * A meter judges its reading one of two ways, never both: `low` / `high` /
 * `optimum` regions, or a `thresholds` list. The union makes passing both a type
 * error rather than a precedence rule to remember.
 */
export type MeterProps = MeterBaseProps & (MeterRegionProps | MeterThresholdProps);

function MeterRoot({
	value: rawValue,
	minValue: rawMinValue = METER_MIN_VALUE,
	maxValue: rawMaxValue = METER_MAX_VALUE,
	formatOptions,
	valueLabel,
	color,
	size,
	segments: rawSegments,
	low,
	high,
	optimum,
	thresholds,
	className,
	children,
	...props
}: MeterProps): ReactElement {
	const axes = resolveMeterAxes({ color, size });
	const trackSize = useSharedValue(0);

	const { minValue, maxValue } = meterRange(rawMinValue, rawMaxValue);
	const value = meterValue(rawValue, minValue, maxValue);
	const ratio = progressRatio(value, minValue, maxValue);
	const segments = meterSegmentCount(rawSegments);
	const lit = segments === null ? 0 : litSegments({ count: segments, ratio });

	const judged = useMemo(
		() =>
			resolveMeterColor({
				color: axes.color,
				maxValue,
				minValue,
				scale: resolveMeterScale({ high, low, optimum, thresholds }),
				value,
			}),
		[axes.color, high, low, maxValue, minValue, optimum, thresholds, value]
	);

	const reading = useMemo(
		() => formatProgressValue({ formatOptions, maxValue, minValue, value }),
		[formatOptions, maxValue, minValue, value]
	);

	const label = useMemo(
		() =>
			resolveMeterValueLabel(valueLabel, {
				color: judged.color,
				formatted: reading,
				maxValue,
				minValue,
				ratio,
				region: judged.region,
				value,
			}),
		[judged.color, judged.region, maxValue, minValue, ratio, reading, value, valueLabel]
	);

	const formatted = label ?? reading;

	const accessibility = useMemo(
		() =>
			resolveProgressAccessibility({
				formatOptions,
				isIndeterminate: false,
				maxValue,
				minValue,
				value,
				valueLabel: label,
			}),
		[formatOptions, label, maxValue, minValue, value]
	);

	const renderProps = useMemo<MeterRenderProps>(
		() => ({
			color: judged.color,
			formatted,
			litSegments: lit,
			maxValue,
			minValue,
			ratio,
			region: judged.region,
			segments,
			value,
		}),
		[formatted, judged.color, judged.region, lit, maxValue, minValue, ratio, segments, value]
	);

	const progressRenderProps = useMemo<ProgressRenderProps>(
		() => ({ formatted, isIndeterminate: false, maxValue, minValue, ratio, value }),
		[formatted, maxValue, minValue, ratio, value]
	);

	// The progress bar's track and fill read this shape, so publishing it is what
	// lets `Meter.Track` and `Meter.Fill` be those parts rather than copies.
	const progressContext = useMemo<ProgressContextValue>(
		() => ({
			color: judged.color,
			isIndeterminate: false,
			ratio,
			renderProps: progressRenderProps,
			size: axes.size,
			trackSize,
		}),
		[axes.size, judged.color, progressRenderProps, ratio, trackSize]
	);

	const meterContext = useMemo<MeterContextValue>(() => ({ renderProps, size: axes.size }), [axes.size, renderProps]);

	// A bare `<Meter value={68} />` draws the scale. A compound root with no
	// default anatomy would draw nothing, which is a failure with no error.
	const content =
		children ??
		(segments === null ? (
			<MeterTrack>
				<MeterFill />
			</MeterTrack>
		) : (
			<MeterSegments />
		));

	return (
		<ProgressProvider value={progressContext}>
			<MeterProvider value={meterContext}>
				<View
					accessibilityRole="progressbar"
					accessibilityValue={accessibility.value}
					accessible
					className={progressVariants({ size: axes.size }).root({ className })}
					{...props}
				>
					{content}
				</View>
			</MeterProvider>
		</ProgressProvider>
	);
}

/**
 * A measurement on a fixed scale, coloured by where it falls — storage used, a
 * battery's charge, a password's strength.
 *
 * A progress bar says how far a task has got; a meter says what a quantity *is*,
 * and its colour is a judgement about that. Judge it one of two ways:
 *
 * - **`low`, `high` and `optimum`** split the scale into a good region, the one
 *   next to it and the far side of that, painted success, warning and
 *   destructive. `optimum` says which end is good — below `low` for a disk,
 *   above `high` for a battery, between them for a temperature.
 * - **`thresholds`** name the colour outright at points along the scale.
 *
 * With neither, the fill is `color`. `segments` draws the scale as whole blocks.
 *
 * The anatomy is the progress bar's — `Meter.Header`, `Meter.Label`,
 * `Meter.Output`, `Meter.Track`, `Meter.Fill` — plus `Meter.Segments`. A bare
 * `<Meter value={68} />` draws the track and fill, or the blocks, on its own.
 *
 * **It is one accessible element with the `progressbar` role**, the scale and
 * the reading published as `accessibilityValue` and a `Meter.Label` as its name.
 * Colour is never the only signal: put the judgement into words with a
 * `valueLabel` function reading `region` — it is spoken as well as drawn.
 *
 * It is not a control, so there is no disabled, invalid or loading state — a
 * reading that is not known yet is a progress bar's indeterminate loop, not a
 * meter.
 *
 * @example
 * <Meter value={68} />
 *
 * @example
 * <Meter value={231} maxValue={256} low={192} high={240} optimum={0} formatOptions={{ style: "unit", unit: "gigabyte" }}>
 *   <Meter.Header>
 *     <Meter.Label>Storage</Meter.Label>
 *     <Meter.Output />
 *   </Meter.Header>
 *   <Meter.Track>
 *     <Meter.Fill />
 *   </Meter.Track>
 * </Meter>
 *
 * @example
 * <Meter accessibilityLabel="Password strength" segments={4} value={3} maxValue={4} valueLabel="Good" />
 */
export const Meter = Object.assign(MeterRoot, {
	/** The row above the scale: a label at the start, a readout at the end. */
	Header: MeterHeader,
	/** What is being measured. Read as the meter's accessible name. */
	Label: MeterLabel,
	/** The reading, formatted. Give it a function to word it — or its region — yourself. */
	Output: MeterOutput,
	/** The continuous groove the fill slides along. */
	Track: MeterTrack,
	/** The painted bar, in the judged colour. */
	Fill: MeterFill,
	/** The scale as whole blocks, for a meter given `segments`. */
	Segments: MeterSegments,
	displayName: "DelacourUI.Meter",
});
