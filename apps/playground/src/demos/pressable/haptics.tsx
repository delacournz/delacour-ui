import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Haptics",
	caption: "The haptic fires inside the gesture worklet, so it lands in the same frame as the press.",
	capture: {},
};

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			{HAPTICS.map((haptic) => (
				<Pressable
					className="rounded-lg bg-tertiary px-3 py-2"
					haptic={haptic}
					key={haptic}
					testID={`haptic-${haptic}`}
				>
					<Text className="text-sm text-tertiary-foreground">{haptic}</Text>
				</Pressable>
			))}
		</View>
	);
}
