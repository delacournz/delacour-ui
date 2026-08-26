import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconPlusMedium } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scroll check",
	caption:
		"Drag from anywhere, including on a button, and the list should scroll rather than the button swallowing the gesture.",
};

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);

	return (
		<View className="gap-3">
			{Array.from({ length: 8 }, (_, i) => (
				<Button haptic="selection" key={i} onPress={bump} testID={`row-${i + 1}`} variant="secondary">
					<Icon icon={IconPlusMedium} />
					<Button.Label>Row {i + 1}</Button.Label>
				</Button>
			))}
			<Text.Caption>{`Pressed ${pressCount} times`}</Text.Caption>
		</View>
	);
}
