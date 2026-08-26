import { Badge } from "@delacour/native-ui/badge";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scroll check",
};

const SCROLL_CHECK = ["one", "two", "three", "four", "five", "six", "seven", "eight"] as const;

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{SCROLL_CHECK.map((label) => (
					<Badge haptic="selection" key={label} onPress={bump} testID={`scroll-${label}`} variant="outline">
						{label}
					</Badge>
				))}
			</View>
			<Text.Caption>{`Pressed ${pressCount}`}</Text.Caption>
		</View>
	);
}
