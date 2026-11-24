import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Marquee } from "@delacour/react-native-ui/marquee";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pause button",
	caption:
		"`isPaused` freezes the strip where it is and clearing it carries on from there. Wire it to a visible control so the loop can be stopped without a long press.",
	align: "stretch",
};

const ITEMS = ["One", "two", "three", "four", "five", "six", "seven", "eight"] as const;

export function Demo(): ReactElement {
	const [isPaused, setIsPaused] = useState(false);

	return (
		<View className="gap-4">
			<Marquee contentClassName="gap-2" isPaused={isPaused} speed={60} testID="marquee-pause-button">
				{ITEMS.map((word) => (
					<Badge key={word} size="lg">
						{word}
					</Badge>
				))}
			</Marquee>
			<Button onPress={() => setIsPaused((paused) => !paused)} testID="marquee-pause-toggle">
				<Button.Label>{isPaused ? "Resume" : "Pause"}</Button.Label>
			</Button>
		</View>
	);
}
