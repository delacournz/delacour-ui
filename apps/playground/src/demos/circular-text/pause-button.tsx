import { Button } from "@delacour/react-native-ui/button";
import { CircularText } from "@delacour/react-native-ui/circular-text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pause button",
	align: "center",
	caption:
		"`isPaused` freezes the ring at its current angle and resumes from the same angle. A screen reader or reduce motion holds it at rest regardless.",
};

export function Demo(): ReactElement {
	const [isPaused, setIsPaused] = useState(false);

	return (
		<View className="items-center gap-8">
			<CircularText
				isPaused={isPaused}
				radius={72}
				repeat="fill"
				size="sm"
				spin={{ kind: "loop", speed: 48 }}
				testID="circular-text-pause-button"
			>
				PAUSE AND RESUME
			</CircularText>
			<Button onPress={() => setIsPaused((paused) => !paused)} testID="circular-text-pause-toggle">
				<Button.Label>{isPaused ? "Resume" : "Pause"}</Button.Label>
			</Button>
		</View>
	);
}
