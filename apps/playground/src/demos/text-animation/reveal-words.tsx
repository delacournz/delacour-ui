import { Button } from "@delacour/react-native-ui/button";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reveal by word",
	caption:
		"The root reveals a string unit by unit. Each word fades and slides up into place, 90 ms after the last. The paragraph is laid out before the first word moves, so it never reflows.",
	align: "stretch",
	capture: { align: "stretch", flow: true, hero: true },
};

export function Demo(): ReactElement {
	const [run, setRun] = useState(0);

	return (
		<View className="gap-6">
			<TextAnimation
				effect={{ kind: "slide", from: "down" }}
				key={run}
				size="3xl"
				testID="text-animation-reveal-words"
				weight="bold"
			>
				Ship the release before lunch, then take the afternoon off
			</TextAnimation>
			<Button
				className="self-start"
				onPress={() => setRun((current) => current + 1)}
				size="sm"
				testID="text-animation-reveal-words-replay"
				variant="secondary"
			>
				<Button.Label>Replay</Button.Label>
			</Button>
		</View>
	);
}
