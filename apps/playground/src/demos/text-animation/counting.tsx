import { Button } from "@delacour/react-native-ui/button";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Counting",
	align: "center",
	caption:
		"A formatted figure tweened to its new value on the UI thread. A tap mid-count retargets from what is on screen, and a screen reader hears only the target.",
};

const BALANCES = [1284.5, 24310.75, 312.2, 98765.43] as const;

export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);

	return (
		<View className="items-center gap-6">
			<TextAnimation.Counting
				format={{ decimals: 2, prefix: "$" }}
				size="3xl"
				testID="text-animation-counting"
				value={BALANCES[index] ?? 0}
				weight="bold"
			/>
			<Button
				onPress={() => setIndex((current) => (current + 1) % BALANCES.length)}
				size="sm"
				testID="text-animation-counting-next"
				variant="secondary"
			>
				<Button.Label>Next balance</Button.Label>
			</Button>
		</View>
	);
}
