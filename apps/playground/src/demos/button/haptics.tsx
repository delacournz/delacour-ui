import { Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Haptics",
};

const HAPTICS = ["selection", "light", "medium", "heavy", "success", "warning", "error"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			{HAPTICS.map((haptic) => (
				<Button haptic={haptic} key={haptic} size="sm" testID={`haptic-${haptic}`} variant="tertiary">
					{haptic}
				</Button>
			))}
		</View>
	);
}
