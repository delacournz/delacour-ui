export { Slider, type SliderProps } from "./slider";
export {
	type SliderContextValue,
	SliderProvider,
	useSlider,
	useSliderContext,
} from "./slider.context";
export type { SliderRenderChildren, SliderRenderProps } from "./slider.types";
export {
	clampThumb,
	fillBounds,
	formatSliderValue,
	fromValueArray,
	nearestThumbIndex,
	progressOf,
	resolveSliderAxes,
	SLIDER_COLORS,
	SLIDER_DEFAULT_COLOR,
	SLIDER_DEFAULT_ORIENTATION,
	SLIDER_DEFAULT_SIZE,
	SLIDER_HAPTIC_MIN_TRAVEL,
	SLIDER_MAX_VALUE,
	SLIDER_MIN_VALUE,
	SLIDER_ORIENTATIONS,
	SLIDER_OUTPUT_TEXT_SIZE,
	SLIDER_RANGE_SEPARATOR,
	SLIDER_SIZES,
	SLIDER_STEP,
	SLIDER_THUMB_ANIMATION,
	SLIDER_THUMB_ICON_STEP,
	SLIDER_THUMB_SPRING,
	type SliderAxes,
	type SliderColor,
	type SliderFieldAxes,
	type SliderOrientation,
	type SliderOwnAxes,
	type SliderSize,
	type SliderVariantProps,
	shouldTickHaptic,
	sliderVariants,
	snapToStep,
	toValueArray,
	valueFromOffset,
} from "./slider.variants";
export type { SliderFillProps } from "./slider-fill";
export type { SliderOutputProps } from "./slider-output";
export type { SliderThumbProps } from "./slider-thumb";
export type { SliderTrackProps } from "./slider-track";
