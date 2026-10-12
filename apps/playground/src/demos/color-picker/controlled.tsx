import { Button } from "@delacour/react-native-ui/button";
import { ColorPicker } from "@delacour/react-native-ui/color-picker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`value` and `onValueChange` hand the colour to you, every frame. Drag into the black edge and back: the parent stores hex, yet the hue survives, because the picker ignores its own echo.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [value, setValue] = useState("#ec4899");

	return (
		<View className="gap-3">
			<ColorPicker onValueChange={setValue} value={value} />
			<Text.Caption color="muted" testID="color-picker-controlled-value">{`value: ${value}`}</Text.Caption>
			<View className="flex-row gap-2">
				<Button onPress={() => setValue("#000000")} size="sm" testID="color-picker-set-black" variant="secondary">
					<Button.Label>Black</Button.Label>
				</Button>
				<Button onPress={() => setValue("#808080")} size="sm" testID="color-picker-set-grey" variant="secondary">
					<Button.Label>Grey</Button.Label>
				</Button>
				<Button
					onPress={() => setValue("hsl(160, 80%, 40%)")}
					size="sm"
					testID="color-picker-set-hsl"
					variant="secondary"
				>
					<Button.Label>hsl()</Button.Label>
				</Button>
			</View>
		</View>
	);
}
