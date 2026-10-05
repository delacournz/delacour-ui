import { type ReactElement, useCallback } from "react";
import { Slider, type SliderProps } from "../slider";
import { useSketchPart } from "./sketch.context";
import { SKETCH_SIZE_LABEL } from "./sketch.variants";

export type SketchSizeProps = Omit<
	SliderProps,
	"value" | "defaultValue" | "onChange" | "minValue" | "maxValue" | "children" | "isDisabled"
> & {
	/** The thumb's accessible name. Default "Stroke width". */
	accessibilityLabel?: string;
};

/**
 * The stroke-width slider, in whole points between the sketch's `minSize` and
 * `maxSize`.
 *
 * A `Slider`, so it is already adjustable by a screen reader. The width applies
 * to the next stroke only — every mark keeps the width it was drawn at.
 */
export function SketchSize({
	accessibilityLabel = SKETCH_SIZE_LABEL,
	step = 1,
	...props
}: SketchSizeProps): ReactElement {
	const { size, minSize, maxSize, setSize, isDisabled } = useSketchPart("Sketch.Size");

	const handleChange = useCallback(
		(next: number | number[]) => {
			const value = Array.isArray(next) ? next[0] : next;
			if (value !== undefined) setSize(value);
		},
		[setSize]
	);

	return (
		<Slider
			{...props}
			isDisabled={isDisabled}
			maxValue={maxSize}
			minValue={minSize}
			onChange={handleChange}
			step={step}
			value={size}
		>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb accessibilityLabel={accessibilityLabel} />
			</Slider.Track>
		</Slider>
	);
}
SketchSize.displayName = "DelacourUI.Sketch.Size";
