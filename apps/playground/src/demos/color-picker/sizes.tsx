import { COLOR_PICKER_SIZES, ColorPicker, type ColorPickerSize } from "@delacour/react-native-ui/color-picker";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "Input's three steps. The area is 160, 200 and 240 points tall, the tracks and thumbs step with it, and every track stays a 44-point target.",
	capture: { align: "stretch" },
};

const LABELS: Record<ColorPickerSize, string> = { sm: "Small", md: "Medium", lg: "Large" };

const PRESETS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{COLOR_PICKER_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<ColorPicker defaultValue="#8b5cf6" size={size}>
						<ColorPicker.Content>
							<ColorPicker.Hue />
							<ColorPicker.Swatches colors={PRESETS} />
						</ColorPicker.Content>
					</ColorPicker>
				</View>
			))}
		</View>
	);
}
