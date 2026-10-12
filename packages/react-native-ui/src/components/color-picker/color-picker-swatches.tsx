import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useColorPickerPart } from "./color-picker.context";
import { colorPickerVariants } from "./color-picker.variants";
import { ColorPickerSwatch } from "./color-picker-swatch";

export type ColorPickerSwatchesProps = Omit<ViewProps, "children"> & {
	/** The presets, in any notation the picker accepts. One `Swatch` each unless `children` is given. */
	colors?: readonly string[];
	className?: string;
	/** Swatches of your own, for a custom label or a mixed row. Replaces `colors`. */
	children?: ReactNode;
};

/**
 * A wrapping row of preset swatches.
 *
 * Exposed to a screen reader as a radio group, since exactly one preset — or
 * none — is the current colour. A swatch that does not parse is skipped rather
 * than drawn as a hole.
 */
export function ColorPickerSwatches({ colors, className, children, ...props }: ColorPickerSwatchesProps): ReactElement {
	const { size, isDisabled } = useColorPickerPart("ColorPicker.Swatches");
	const slots = colorPickerVariants({ isDisabled, size });

	return (
		<View accessibilityRole="radiogroup" className={slots.swatches({ className })} {...props}>
			{children ?? colors?.map((color) => <ColorPickerSwatch color={color} key={color} />)}
		</View>
	);
}
ColorPickerSwatches.displayName = "DelacourUI.ColorPicker.Swatches";
