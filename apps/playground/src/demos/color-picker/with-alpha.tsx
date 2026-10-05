import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With alpha",
	caption:
		"`hasAlpha` adds the opacity track: the current colour fading to a checkerboard, with the same RGB the whole way. Hex grows to eight digits below full opacity.",
	keyboardAware: true,
	capture: { flow: "color-picker/with-alpha", align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<ColorPicker defaultValue="#3b82f6b3" hasAlpha>
				<ColorPicker.Content>
					<ColorPicker.Area />
					<ColorPicker.Hue />
					<ColorPicker.Alpha testID="color-picker-alpha" />
					<View className="flex-row items-center gap-3">
						<ColorPicker.Preview />
						<ColorPicker.Input className="flex-1" />
					</View>
				</ColorPicker.Content>
			</ColorPicker>
		</View>
	);
}
