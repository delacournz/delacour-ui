import { Button } from "@delacour/react-native-ui/button";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reveal by character",
	align: "center",
	caption:
		'`split="character"` scales each grapheme in, and `order="center"` starts from the middle and works outwards. A word is held on one line, so it never breaks mid-glyph.',
	capture: { flow: "text-animation/reveal-characters" },
};

export function Demo(): ReactElement {
	const [run, setRun] = useState(0);

	return (
		<View className="items-center gap-6">
			<TextAnimation
				align="center"
				effect={{ kind: "scale", from: 0.4 }}
				key={run}
				order="center"
				size="3xl"
				split="character"
				testID="text-animation-reveal-characters"
				weight="bold"
			>
				Delacour
			</TextAnimation>
			<Button
				onPress={() => setRun((current) => current + 1)}
				size="sm"
				testID="text-animation-reveal-characters-replay"
				variant="secondary"
			>
				<Button.Label>Replay</Button.Label>
			</Button>
		</View>
	);
}
