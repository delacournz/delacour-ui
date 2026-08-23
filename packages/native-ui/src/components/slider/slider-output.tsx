import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useSliderPart } from "./slider.context";
import type { SliderRenderChildren } from "./slider.types";
import { formatSliderValue, SLIDER_OUTPUT_TEXT_SIZE, sliderVariants } from "./slider.variants";

export type SliderOutputProps = Omit<TextPresetProps, "children"> & {
	/** Custom content, or a function called with the slider's settled state. */
	children?: SliderRenderChildren;
};

/**
 * The current value, formatted.
 *
 * Renders `Text.Label` and names a size, never a scale of its own. The weight and
 * the colour belong to the preset — restating them here would be a second
 * definition of `Text.Label` that could drift from it, the rule `Field` is built
 * on. Naming the size is what lets the readout still track the slider's own axis,
 * since `Text`'s size axis is built to beat its preset.
 *
 * A range is joined with an en dash. `formatOptions` goes straight to
 * `Intl.NumberFormat`, so a currency or a percentage needs nothing but the
 * options object the platform already understands.
 *
 * **It reads React state, not the shared value the thumb reads**, and that is the
 * one place in this component where a value crosses back to the JS thread during
 * a drag. `Intl` is not available to a worklet, so a formatted readout cannot be
 * derived on the UI thread without giving up `formatOptions` entirely. The cost
 * is bounded instead: the pan snaps on the UI thread and only a *changed* snapped
 * value is mirrored across, so a full-width drag at the default step is a few
 * dozen commits. A continuous slider — `step={0}` — has no stops to change on and
 * does re-render per frame; if that ever profiles badly, the escape hatch is an
 * `Animated.Text` fed by a `useDerivedValue`, which `Text` already renders and
 * which trades `formatOptions` away.
 */
export function SliderOutput({ children, className, size, ...props }: SliderOutputProps): ReactElement {
	const context = useSliderPart("Slider.Output");
	const { color, size: sliderSize, isDisabled, isInvalid, orientation, values, formatOptions } = context;

	const content =
		typeof children === "function"
			? children(context.renderProps)
			: (children ?? formatSliderValue(values, formatOptions));

	return (
		<Text.Label
			className={sliderVariants({ color, isDisabled, isInvalid, orientation, size: sliderSize }).output({ className })}
			size={size ?? SLIDER_OUTPUT_TEXT_SIZE[sliderSize]}
			{...props}
		>
			{content}
		</Text.Label>
	);
}
SliderOutput.displayName = "DelacourUI.Slider.Output";
