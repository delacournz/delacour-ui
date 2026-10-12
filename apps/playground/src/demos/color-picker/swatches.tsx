import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swatches",
	caption:
		"Presets under the area. Tapping one sets the colour and commits; the current colour's swatch is ringed, whichever notation the preset was written in.",
	capture: { flow: "color-picker/swatches", align: "stretch" },
};

const PRESETS = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#71717a"] as const;

export function Demo(): ReactElement {
	return (
		<ColorPicker defaultValue="#22c55e">
			<ColorPicker.Content>
				<ColorPicker.Area />
				<ColorPicker.Hue />
				<ColorPicker.Swatches testID="color-picker-swatches">
					{PRESETS.map((color) => (
						<ColorPicker.Swatch color={color} key={color} testID={`color-picker-swatch-${color.slice(1)}`} />
					))}
				</ColorPicker.Swatches>
			</ColorPicker.Content>
		</ColorPicker>
	);
}
