import { Icon } from "@delacour/native-ui/icon";
import { IconHeart } from "@delacour/native-ui/icons/central";
import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scroll check",
	caption:
		"Drag from anywhere, including on a row, and the list should scroll rather than the row swallowing the gesture.",
};

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);

	return (
		<View className="gap-3">
			{Array.from({ length: 8 }, (_, i) => (
				<Pressable
					className="flex-row items-center gap-3 rounded-xl bg-secondary px-4 py-3"
					haptic="selection"
					key={i}
					onPress={bump}
					testID={`row-${i + 1}`}
				>
					<Icon color="secondary-foreground" icon={IconHeart} size={18} />
					<Text className="text-base text-secondary-foreground">Row {i + 1}</Text>
				</Pressable>
			))}
			<Text.Caption>{`Pressed ${pressCount} times`}</Text.Caption>
		</View>
	);
}
