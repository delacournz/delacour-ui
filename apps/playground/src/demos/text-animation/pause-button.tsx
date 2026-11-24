import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pause button",
	align: "center",
	caption:
		"`isPaused` holds the rotating word where it is and resumes the cycle from there. Reduce motion and a screen reader hold it at rest regardless.",
};

const WORDS = ["fast", "small", "remote", "growing"] as const;

export function Demo(): ReactElement {
	const [isPaused, setIsPaused] = useState(false);

	return (
		<View className="items-center gap-6">
			<View className="flex-row items-end">
				<Text size="2xl" weight="semibold">
					Built for{" "}
				</Text>
				<TextAnimation.Rotating
					className="text-primary"
					isPaused={isPaused}
					phrases={WORDS}
					size="2xl"
					testID="text-animation-pause-rotating"
					weight="semibold"
				/>
				<Text size="2xl" weight="semibold">
					{" "}
					teams
				</Text>
			</View>
			<Button onPress={() => setIsPaused((paused) => !paused)} testID="text-animation-pause-toggle">
				<Button.Label>{isPaused ? "Resume" : "Pause"}</Button.Label>
			</Button>
		</View>
	);
}
