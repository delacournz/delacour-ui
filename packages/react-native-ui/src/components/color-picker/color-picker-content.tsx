import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useColorPickerPart } from "./color-picker.context";
import { colorPickerVariants } from "./color-picker.variants";
import { ColorPickerSheetContent } from "./color-picker-sheet";

export type ColorPickerContentProps = Omit<ViewProps, "children"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The picker's surface — where the area, the tracks, the field and the swatches go.
 *
 * Inline, a plain column. With `presentation="sheet"` the same children move into
 * a `BottomSheet` — scrim, panel and body — opened by `ColorPicker.Trigger`. The
 * parts inside do not know which they are in.
 */
export function ColorPickerContent({ className, children, ...props }: ColorPickerContentProps): ReactElement {
	const { presentation, size } = useColorPickerPart("ColorPicker.Content");
	const slots = colorPickerVariants({ size });

	if (presentation === "sheet") {
		return <ColorPickerSheetContent className={slots.content({ className })}>{children}</ColorPickerSheetContent>;
	}

	return (
		<View className={slots.content({ className })} {...props}>
			{children}
		</View>
	);
}
ColorPickerContent.displayName = "DelacourUI.ColorPicker.Content";
