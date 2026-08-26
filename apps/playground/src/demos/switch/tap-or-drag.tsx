import { SWITCH_SIZES, Switch } from "@delacour/native-ui/switch";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tap or drag",
	caption:
		"One `Gesture.Pan()` drives both. A tap toggles; a drag takes the thumb with your finger and a release settles by position, or by a flick's velocity if you let go fast. Drag one half way and back — it commits nothing.",
	capture: { flow: "switch/tap-or-drag", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-4">
			{SWITCH_SIZES.map((size) => (
				<Switch color="primary" defaultSelected key={size} size={size} testID={`switch-${size}`} />
			))}
		</View>
	);
}
