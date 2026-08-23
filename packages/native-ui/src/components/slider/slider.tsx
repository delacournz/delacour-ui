import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import type { HapticFeedback } from "../pressable";
import { type SliderContextValue, SliderProvider } from "./slider.context";
import type { SliderRenderProps } from "./slider.types";
import {
	clampThumb,
	fromValueArray,
	resolveSliderAxes,
	SLIDER_MAX_VALUE,
	SLIDER_MIN_VALUE,
	SLIDER_STEP,
	type SliderColor,
	type SliderOrientation,
	type SliderSize,
	sliderVariants,
	snapToStep,
	toValueArray,
} from "./slider.variants";
import { SliderFill } from "./slider-fill";
import { SliderOutput } from "./slider-output";
import { SliderThumb } from "./slider-thumb";
import { SliderTrack } from "./slider-track";

export type SliderProps = Omit<ViewProps, "children"> & {
	/** Controlled value. An array makes it a range, one thumb per entry. */
	value?: number | number[];
	/** Starting value while uncontrolled. An array makes it a range. */
	defaultValue?: number | number[];
	minValue?: number;
	maxValue?: number;
	/** The increment the value snaps to. `0` is continuous, and never ticks. */
	step?: number;
	/** Passed to `Intl.NumberFormat` by `Slider.Output`. */
	formatOptions?: Intl.NumberFormatOptions;
	/** `vertical` counts up from the bottom, and needs a definite height. */
	orientation?: SliderOrientation;
	/** What the filled part of the track means. */
	color?: SliderColor;
	size?: SliderSize;
	/** Blocks the drag and fades the control. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Reports an invalid value. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Played on grab and as the value crosses a step. `false` silences it. */
	haptic?: false | HapticFeedback;
	/** Fires on every change during the drag. */
	onChange?: (value: number | number[]) => void;
	/** Fires once, when the drag is released. Where a network write belongs. */
	onChangeEnd?: (value: number | number[]) => void;
	children?: ReactNode;
};

function SliderRoot({
	value,
	defaultValue = SLIDER_MIN_VALUE,
	minValue = SLIDER_MIN_VALUE,
	maxValue = SLIDER_MAX_VALUE,
	step = SLIDER_STEP,
	formatOptions,
	orientation,
	color,
	size,
	isDisabled,
	isInvalid,
	haptic = "selection",
	onChange,
	onChangeEnd,
	className,
	children,
	...props
}: SliderProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveSliderAxes({ field, own: { color, isDisabled, isInvalid, orientation, size } });

	const [current, setCurrent] = useControllableState<number | number[]>({
		defaultValue,
		onChange,
		value,
	});

	// Which shape the caller speaks is locked on first render, exactly the way
	// `useControllableState` locks controlled versus uncontrolled — a slider that
	// silently started reporting an array to a caller holding a number would be a
	// bug with no error attached. Warn once per flip, and follow the caller rather
	// than fighting them.
	const isRangeNow = Array.isArray(value ?? defaultValue);
	const wasRange = useRef(isRangeNow);
	if (process.env.NODE_ENV !== "production" && wasRange.current !== isRangeNow) {
		console.warn(
			`Slider: switched from ${wasRange.current ? "a range" : "a single value"} to ` +
				`${isRangeNow ? "a range" : "a single value"}. Pick one for the lifetime of the component.`
		);
		wasRange.current = isRangeNow;
	}
	const isRange = wasRange.current;

	const values = useMemo(() => toValueArray(current), [current]);

	const positions = useSharedValue<number[]>(toValueArray(current));
	const trackSize = useSharedValue(0);
	const thumbSize = useSharedValue(0);
	const activeIndex = useSharedValue(-1);

	// A ref rather than state: the pan reads it a few times a drag and nothing
	// renders differently for it, so a re-render on touch-down would be pure cost.
	const isDragging = useRef(false);
	// Bumped when a drag finishes, purely to make the sync effect below run again.
	// Without it a controlled parent that *rejects* the dragged value leaves the
	// thumb where the finger let go, because `current` never changed to sync from.
	const [settledDrags, setSettledDrags] = useState(0);

	// `settledDrags` is not read in the body — being unread is the whole point of
	// it. A controlled parent that rejects a dragged value leaves `current`
	// unchanged, so without a token that moves on every release there is nothing to
	// re-run on, and the thumb stays where the finger let go rather than snapping
	// back to the value the parent actually holds.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the extra dependency is the re-run trigger, see above
	useEffect(() => {
		if (isDragging.current) return;
		positions.value = toValueArray(current);
	}, [current, positions, settledDrags]);

	const setDragging = useCallback((dragging: boolean) => {
		isDragging.current = dragging;
	}, []);

	const commitValues = useCallback(
		(next: number[]) => {
			setCurrent(fromValueArray(next, isRange));
		},
		[isRange, setCurrent]
	);

	const commitEnd = useCallback(
		(next: number[]) => {
			setSettledDrags((count) => count + 1);
			onChangeEnd?.(fromValueArray(next, isRange));
		},
		[isRange, onChangeEnd]
	);

	// The one way into the value that has no gesture behind it — an assistive
	// increment. It runs the same snap and the same clamp the pan does, from the
	// JS thread, and writes both sides so the thumb moves without waiting on a
	// render.
	const valuesRef = useRef(values);
	valuesRef.current = values;

	const updateValue = useCallback(
		(index: number, next: number) => {
			const from = valuesRef.current;
			const settled = clampThumb(snapToStep(next, step, minValue, maxValue), from, index, minValue, maxValue);
			if (settled === from[index]) return;

			const updated = [...from];
			updated[index] = settled;
			positions.value = updated;
			setCurrent(fromValueArray(updated, isRange));
			onChangeEnd?.(fromValueArray(updated, isRange));
		},
		[isRange, maxValue, minValue, onChangeEnd, positions, setCurrent, step]
	);

	const renderProps = useMemo<SliderRenderProps>(
		() => ({
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			maxValue,
			minValue,
			orientation: axes.orientation,
			step,
			values,
		}),
		[axes.isDisabled, axes.isInvalid, axes.orientation, maxValue, minValue, step, values]
	);

	const context = useMemo<SliderContextValue>(
		() => ({
			activeIndex,
			color: axes.color,
			commitEnd,
			commitValues,
			formatOptions,
			haptic,
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			maxValue,
			minValue,
			orientation: axes.orientation,
			positions,
			renderProps,
			setDragging,
			size: axes.size,
			step,
			thumbSize,
			trackSize,
			updateValue,
			values,
		}),
		[
			activeIndex,
			axes.color,
			axes.isDisabled,
			axes.isInvalid,
			axes.orientation,
			axes.size,
			commitEnd,
			commitValues,
			formatOptions,
			haptic,
			maxValue,
			minValue,
			positions,
			renderProps,
			setDragging,
			step,
			thumbSize,
			trackSize,
			updateValue,
			values,
		]
	);

	return (
		<SliderProvider value={context}>
			<View className={sliderVariants(axes).root({ className })} {...props}>
				{children}
			</View>
		</SliderProvider>
	);
}

/**
 * A value picked by dragging along a track — one value, or a range.
 *
 * The anatomy is written out rather than assembled from props: a `Slider.Track`
 * holding a `Slider.Fill` and one `Slider.Thumb` per value, with an optional
 * `Slider.Output` above it. A range's thumb count is data, so `Slider.Track`
 * takes a function and maps over the values it is handed.
 *
 * **The whole track is the target.** Touching down grabs the nearest thumb and
 * moves it to the finger; there is no separate tap mode. `Slider.Thumb` holds no
 * gesture of its own, which is what makes a press on empty track lift the handle
 * it is about to move.
 *
 * **State works either way from one hook**: pass `value` to control it, or
 * nothing and let it hold its own. The shape is the caller's — a slider given a
 * number reports a number, one given an array reports an array — and it is locked
 * on first render.
 *
 * `onChange` fires throughout the drag; `onChangeEnd` fires once on release,
 * which is where a network write or a persisted preference belongs.
 *
 * `isInvalid` and `isDisabled` cascade in from an enclosing `Field`, so
 * `<Field isDisabled>` dims it with nothing said here — and an explicit prop still
 * wins, in either direction.
 *
 * A haptic ticks on grab and as the value crosses a step, rate-limited by how far
 * the drag has travelled so a fine step scale reads as a cadence rather than a
 * buzz. `haptic={false}` silences it; a continuous slider never ticks.
 *
 * **A `vertical` slider needs a definite height from its parent** — it counts up
 * from the bottom and fills whatever it is given, so a wrapper with `h-48` or
 * `flex-1` is not optional.
 *
 * @example
 * <Slider defaultValue={30}>
 *   <Slider.Output />
 *   <Slider.Track>
 *     <Slider.Fill />
 *     <Slider.Thumb />
 *   </Slider.Track>
 * </Slider>
 *
 * @example
 * <Slider
 *   color="success"
 *   formatOptions={{ currency: "NZD", style: "currency" }}
 *   maxValue={1000}
 *   onChange={setPrice}
 *   step={10}
 *   value={price}
 * >
 *   <Slider.Output />
 *   <Slider.Track>
 *     {({ values }) => (
 *       <>
 *         <Slider.Fill />
 *         {values.map((_, index) => (
 *           <Slider.Thumb index={index} key={index} />
 *         ))}
 *       </>
 *     )}
 *   </Slider.Track>
 * </Slider>
 *
 * @example
 * <View className="h-48">
 *   <Slider defaultValue={40} orientation="vertical">
 *     <Slider.Track>
 *       <Slider.Fill />
 *       <Slider.Thumb />
 *     </Slider.Track>
 *   </Slider>
 * </View>
 */
export const Slider = Object.assign(SliderRoot, {
	/** The current value, formatted. Give it a function to label it yourself. */
	Output: SliderOutput,
	/** The groove the thumbs run along, and the surface the drag is claimed on. */
	Track: SliderTrack,
	/** The painted part of the groove, from the minimum — or between two thumbs. */
	Fill: SliderFill,
	/** The grab handle. `index` picks which value it drives in a range. */
	Thumb: SliderThumb,
	displayName: "DelacourUI.Slider",
});
