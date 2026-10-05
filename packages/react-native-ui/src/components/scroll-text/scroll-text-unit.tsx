import type { ReactElement } from "react";
import Animated, { interpolateColor, type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Text, type TextProps } from "../text";
import {
	resolveEffectFrame,
	resolveRevealProgress,
	type ScrollTextEffect,
	scrollTextVariants,
} from "./scroll-text.variants";

/** The colour values a unit interpolates between, resolved once by the block — never per frame. */
export type ScrollTextUnitColors = {
	/** A `colour` effect's text colour at 0 and 1. */
	textFrom?: string;
	textTo?: string;
	/** A `highlight` effect's band colour at 0 and 1. */
	bandFrom?: string;
	bandTo?: string;
};

export type ScrollTextUnitProps = Omit<TextProps, "children" | "style"> & {
	text: string;
	index: number;
	count: number;
	overlap: number;
	progress: SharedValue<number>;
	effect: ScrollTextEffect;
	colors: ScrollTextUnitColors;
	isCalm: boolean;
};

/**
 * One animated piece of a `ScrollText` — a word, a grapheme or a line.
 *
 * Its whole job is one animated style off the block's single `progress`: the
 * stagger (`resolveRevealProgress`) and the effect (`resolveEffectFrame`) are pure
 * functions run as worklets, and the only properties written are `opacity`,
 * `transform`, `color` and `backgroundColor`, so a frame never commits layout.
 *
 * Renders a `Text` with no axes of its own, so it inherits the block's resolved
 * class exactly through the cascade — every unit, and the measuring text, set in
 * the same type, which is what makes the wrapped units break where a plain `Text`
 * would. A highlight puts the unit in a rounded band; any other effect renders the
 * text alone. Hidden from assistive technology: the block speaks the full string.
 */
export function ScrollTextUnit({
	text,
	index,
	count,
	overlap,
	progress,
	effect,
	colors,
	isCalm,
	...props
}: ScrollTextUnitProps): ReactElement {
	const { textFrom, textTo, bandFrom, bandTo } = colors;

	const textStyle = useAnimatedStyle(() => {
		const frame = resolveEffectFrame(effect, resolveRevealProgress(progress.value, index, count, overlap), isCalm);
		const motion = { opacity: frame.opacity, transform: [{ translateY: frame.translate }] };
		if (textFrom === undefined || textTo === undefined) return motion;
		return { ...motion, color: interpolateColor(frame.colorT, [0, 1], [textFrom, textTo]) };
	});

	const bandStyle = useAnimatedStyle(() => {
		if (bandFrom === undefined || bandTo === undefined) return {};
		const frame = resolveEffectFrame(effect, resolveRevealProgress(progress.value, index, count, overlap), isCalm);
		return { backgroundColor: interpolateColor(frame.fillT, [0, 1], [bandFrom, bandTo]) };
	});

	const unit = (
		<Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={textStyle} {...props}>
			{text}
		</Text>
	);

	if (effect.kind !== "highlight") return unit;

	return (
		<Animated.View className={scrollTextVariants().band()} style={bandStyle}>
			{unit}
		</Animated.View>
	);
}
ScrollTextUnit.displayName = "DelacourUI.ScrollText.Unit";
