import type { ReactElement } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { hsvToRgb } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import { colorPickerVariants } from "./color-picker.variants";
import { ColorPickerCheckerboard } from "./color-picker-checkerboard";

export type ColorPickerPreviewProps = Omit<ViewProps, "children" | "style"> & {
	className?: string;
};

/**
 * A swatch of the current colour, over a checkerboard so its alpha shows.
 *
 * Painted from the live model on the UI thread, so it tracks a drag frame for
 * frame without React rendering. Hidden from assistive technology: it repeats
 * what the area, the tracks and the field already announce.
 */
export function ColorPickerPreview({ className, ...props }: ColorPickerPreviewProps): ReactElement {
	const { live, size } = useColorPickerPart("ColorPicker.Preview");
	const slots = colorPickerVariants({ size });

	const colorStyle = useAnimatedStyle(() => {
		const { r, g, b, a } = hsvToRgb(live.value);
		return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` };
	});

	return (
		<Animated.View
			accessibilityElementsHidden
			className={slots.preview({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		>
			<ColorPickerCheckerboard />
			<Animated.View style={[StyleSheet.absoluteFill, colorStyle]} />
		</Animated.View>
	);
}
ColorPickerPreview.displayName = "DelacourUI.ColorPicker.Preview";
