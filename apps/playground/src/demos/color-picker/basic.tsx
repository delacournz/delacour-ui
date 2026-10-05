import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"A bare `<ColorPicker />` is complete: the saturation and brightness area, the hue track and the hex field. The readout updates on release, through `onValueCommit`.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [committed, setCommitted] = useState("#f59e0b");

	return (
		<View className="gap-3">
			<ColorPicker defaultValue="#f59e0b" onValueCommit={setCommitted} testID="color-picker-basic" />
			<Text.Caption color="muted" testID="color-picker-basic-value">{`Committed: ${committed}`}</Text.Caption>
		</View>
	);
}
