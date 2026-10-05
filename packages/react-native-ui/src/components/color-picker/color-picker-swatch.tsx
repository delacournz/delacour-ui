import { type ReactElement, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Pressable, type PressableProps } from "../pressable";
import { formatColor, isSameColor, normalizeHsva, parseColor } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import { COLOR_PICKER_RING_FADE_MS, colorPickerVariants } from "./color-picker.variants";
import { ColorPickerCheckerboard } from "./color-picker-checkerboard";

export type ColorPickerSwatchProps = Omit<PressableProps, "onPress" | "children"> & {
	/** The preset, in any notation the picker accepts. */
	color: string;
	/** What a screen reader reads. Defaults to the colour's hex. */
	accessibilityLabel?: string;
	className?: string;
};

/**
 * One preset. Tapping it sets the colour and commits.
 *
 * Ringed while it is the current colour — compared as hex, so `rgb(245 158 11)`
 * and `#f59e0b` select the same swatch. The ring is its own layer over a
 * transparent border of the same width, so it fades in without the swatch
 * moving; under calm motion it snaps. A preset with alpha shows it over a
 * checkerboard; on a picker without `hasAlpha` it lands opaque, as every other
 * input path does.
 *
 * Read-only and disabled both ignore the tap. Returns null for a colour that
 * does not parse.
 */
export function ColorPickerSwatch({
	color,
	accessibilityLabel,
	className,
	...props
}: ColorPickerSwatchProps): ReactElement | null {
	const { hsva, size, hasAlpha, isDisabled, isReadOnly, setHsva } = useColorPickerPart("ColorPicker.Swatch");
	const isCalm = useCalmMotion();
	const parsed = parseColor(color);
	const preset = parsed ? normalizeHsva(parsed, hasAlpha) : null;
	const hex = preset ? formatColor(preset, "hex") : "";
	const isSelected = preset !== null && isSameColor(hex, hsva, "hex");

	const ring = useSharedValue(isSelected ? 1 : 0);
	useEffect(() => {
		const target = isSelected ? 1 : 0;
		ring.value = isCalm ? target : withTiming(target, { duration: COLOR_PICKER_RING_FADE_MS });
	}, [isCalm, isSelected, ring]);
	const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

	if (!preset) return null;
	const slots = colorPickerVariants({ size });

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? hex}
			accessibilityRole="radio"
			accessibilityState={{ checked: isSelected, disabled: isDisabled, selected: isSelected }}
			className={slots.swatch({ className })}
			disabled={isDisabled || isReadOnly}
			feedback="scale"
			onPress={() => setHsva(preset, { commit: true })}
			{...props}
		>
			<Animated.View className={slots.swatchRing()} pointerEvents="none" style={ringStyle} />
			<View className={slots.swatchFill()}>
				<ColorPickerCheckerboard />
				<View style={[StyleSheet.absoluteFill, { backgroundColor: formatColor(preset, "rgb") }]} />
			</View>
		</Pressable>
	);
}
ColorPickerSwatch.displayName = "DelacourUI.ColorPicker.Swatch";
