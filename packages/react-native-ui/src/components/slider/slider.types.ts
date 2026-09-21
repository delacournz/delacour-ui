import type { SliderOrientation } from "./slider.variants";

/**
 * What a render function inside a slider is handed.
 *
 * Shared by `Slider.Output` and `Slider.Track`, which is what puts it here rather
 * than in either one's own file — two consumers is the bar a `{name}.types.ts`
 * entry has to clear. See AGENTS.md.
 *
 * It carries the *settled* state, so a render function never has to know whether
 * an axis came from its own call site or from an enclosing `Field`.
 */
export type SliderRenderProps = {
	/** Every thumb's value, in the order the thumbs were given. */
	values: number[];
	minValue: number;
	maxValue: number;
	/** The increment the values snap to. `0` is continuous. */
	step: number;
	orientation: SliderOrientation;
	isDisabled: boolean;
	isInvalid: boolean;
};

/** A part whose children may be written out or computed from the slider's state. */
export type SliderRenderChildren = React.ReactNode | ((props: SliderRenderProps) => React.ReactNode);
