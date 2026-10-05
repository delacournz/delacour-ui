import { Button } from "@delacour/react-native-ui/button";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Rolling",
	align: "center",
	caption:
		"An odometer: each digit is a wheel that rolls the short way to its new digit, least significant first. Separators stay put, and tabular figures keep every wheel the same width.",
	capture: { flow: "text-animation/rolling" },
};

const READINGS = [1248, 9731, 10004, 999] as const;

export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);

	return (
		<View className="items-center gap-6">
			<TextAnimation.Rolling size="3xl" testID="text-animation-rolling" value={READINGS[index] ?? 0} weight="bold" />
			<Button
				onPress={() => setIndex((current) => (current + 1) % READINGS.length)}
				size="sm"
				testID="text-animation-rolling-next"
				variant="secondary"
			>
				<Button.Label>Next reading</Button.Label>
			</Button>
		</View>
	);
}
