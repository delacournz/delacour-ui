import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSliderPart } from "./slider.context";
import { fillBounds, fillExtent, sliderVariants } from "./slider.variants";

export type SliderFillProps = Omit<ViewProps, "children" | "style"> & {
	className?: string;
};

/**
 * The painted part of the groove.
 *
 * A lone thumb fills from the start of the track, because that is what a single
 * value means — how far along. A range fills *between* its own thumbs, because
 * the ends are what the caller excluded. {@link fillBounds} is that decision and
 * is pure, so `bun test` sweeps it.
 *
 * **The far end lands on the thumb's far edge**, which is what makes both extremes
 * exact: one thumb's width of fill at the minimum, so the handle covers it
 * completely and a slider at rest shows a plain track, and the track's full length
 * at the maximum, with no sliver of empty groove past the handle. That works only
 * because the thumb's diameter is the track's thickness — {@link fillExtent} is
 * where the arithmetic lives, and where `bun test` can hold it down.
 *
 * The extent is an animated style rather than a class because it is a measured
 * length in points, and a class cannot name one. The *colour* is a class, which
 * is what keeps the whole colour matrix inside `bun test`.
 *
 * Nothing here reads React state: the fill follows the shared value the pan
 * writes, so it tracks the finger at the display's refresh rate rather than at
 * React's.
 */
export function SliderFill({ className, ...props }: SliderFillProps): ReactElement {
	const { positions, trackSize, thumbSize, minValue, maxValue, orientation, color, size, isInvalid, isDisabled } =
		useSliderPart("Slider.Fill");
	const isVertical = orientation === "vertical";

	const fillStyle = useAnimatedStyle(() => {
		const thumb = thumbSize.value;
		const values = positions.value;
		const bounds = fillBounds(values, minValue, maxValue);
		// Both helpers hold themselves at zero until the layouts have landed. A
		// measured 0 means "not measured yet", never "a track with no length", and
		// dividing into it would put NaN on the UI thread — which no later frame
		// recovers from.
		const { offset, extent } = fillExtent({
			end: bounds.end,
			isRange: values.length > 1,
			start: bounds.start,
			thumbSize: thumb,
			travel: trackSize.value - thumb,
		});

		// The same keys every frame, so Reanimated is never asked to swap a style's
		// shape mid-animation.
		return isVertical ? { bottom: offset, height: extent } : { left: offset, width: extent };
	});

	return (
		<Animated.View
			className={sliderVariants({ color, isDisabled, isInvalid, orientation, size }).fill({ className })}
			style={fillStyle}
			{...props}
		/>
	);
}
SliderFill.displayName = "DelacourUI.Slider.Fill";
