import type { ReactElement, ReactNode } from "react";
import { Text, type TextPresetProps } from "../text";
import { type RatingRenderProps, useRatingPart } from "./rating.context";
import { formatRatingValue, RATING_OUTPUT_TEXT_SIZE, ratingVariants } from "./rating.variants";

export type RatingOutputProps = Omit<TextPresetProps, "children"> & {
	/** Custom content, or a function called with the rating's settled state. */
	children?: ReactNode | ((props: RatingRenderProps) => ReactNode);
};

/**
 * The value, formatted — `4`, or `3.5`.
 *
 * Renders `Text.Label` and names a size step, never a scale of its own, the rule
 * `Slider.Output` follows: the preset owns the weight and the colour, and the
 * readout still tracks the rating's size.
 *
 * It is hidden from assistive technology. `Rating.Stars` already speaks the
 * value as "3.5 out of 5", and a second, terser reading of the same number one
 * swipe later is noise.
 */
export function RatingOutput({ children, className, size, ...props }: RatingOutputProps): ReactElement {
	const context = useRatingPart("Rating.Output");
	const content =
		typeof children === "function" ? children(context.renderProps) : (children ?? formatRatingValue(context.value));

	return (
		<Text.Label
			accessibilityElementsHidden
			className={ratingVariants({ size: context.size }).output({ className })}
			importantForAccessibility="no-hide-descendants"
			size={size ?? RATING_OUTPUT_TEXT_SIZE[context.size]}
			{...props}
		>
			{content}
		</Text.Label>
	);
}
RatingOutput.displayName = "DelacourUI.Rating.Output";
