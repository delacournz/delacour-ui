import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSliderPart } from "./slider.context";
import { fillBounds, sliderVariants } from "./slider.variants";

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
 * **Both ends land on a thumb's centre, not on its edge.** The thumb travels
 * `trackSize - thumbSize` and sits `thumbSize / 2` in from wherever its box
 * starts, so the fill has to carry that half-width or it stops short of the
 * handle at one end and runs out from under it at the other — visible as a sliver
 * of empty groove that grows and shrinks as you drag.
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
		const travel = trackSize.value - thumb;
		const values = positions.value;
		const bounds = fillBounds(values, minValue, maxValue);
		const half = thumb / 2;

		// Held at zero until both layouts have landed. A measured 0 means "not
		// measured yet", never "a track with no length", and dividing into it would
		// put NaN on the UI thread — which no later frame recovers from.
		const from = travel <= 0 ? 0 : values.length > 1 ? bounds.start * travel + half : 0;
		const to = travel <= 0 ? 0 : bounds.end * travel + half;

		// The same keys every frame, so Reanimated is never asked to swap a style's
		// shape mid-animation.
		return isVertical ? { bottom: from, height: to - from } : { left: from, width: to - from };
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
