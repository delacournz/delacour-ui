import type { TextProps } from "../text/text";

/**
 * The props every part shares: the `Text` axes, applied to each piece of text
 * the part draws, plus the few `Text` props that still mean one thing.
 *
 * A subset of `TextProps` rather than all of it. A part is a `View` holding
 * many texts — a unit, a wheel, a layer — so a text-only prop such as
 * `onPress` or `numberOfLines` has no single text to land on. `className` is
 * merged into every text's class, after the axes, exactly as on `Text`; wrap
 * the part in a `View` for layout.
 */
export type TextAnimationBase = Pick<
	TextProps,
	| "variant"
	| "size"
	| "weight"
	| "color"
	| "align"
	| "transform"
	| "allowFontScaling"
	| "maxFontSizeMultiplier"
	| "testID"
	| "nativeID"
	| "accessibilityHint"
> & {
	className?: string;
};
