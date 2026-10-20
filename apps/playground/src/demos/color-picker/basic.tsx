import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"The saturation and brightness area, the hue track and the hex field — what a bare `<ColorPicker />` draws. The readout updates on release, through `onValueCommit`.",
	keyboardAware: true,
	capture: { flow: true, hero: true, align: "stretch" },
};

export function Demo(): ReactElement {
	const [committed, setCommitted] = useState("#ffa100");

	return (
		<View className="gap-3">
			<ColorPicker defaultValue="#ffa100" onValueCommit={setCommitted}>
				<ColorPicker.Content>
					<ColorPicker.Area testID="color-picker-basic-area" />
					<ColorPicker.Hue testID="color-picker-basic-hue" />
					<ColorPicker.Input />
				</ColorPicker.Content>
			</ColorPicker>
			<Text.Caption color="muted" testID="color-picker-basic-value">{`Committed: ${committed}`}</Text.Caption>
		</View>
	);
}
