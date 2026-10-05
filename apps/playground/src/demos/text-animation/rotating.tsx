import { Text } from "@delacour/react-native-ui/text";
import { TextAnimation } from "@delacour/react-native-ui/text-animation";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Rotating",
	align: "center",
	caption:
		"One word swapped in place inside a sentence. The slot holds its widest phrase, so the words around it never move.",
	capture: { flow: "text-animation/rotating", leadMs: 0, tailMs: 0 },
};

const WORDS = ["fast", "small", "remote", "growing"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-end">
			<Text size="2xl" weight="semibold">
				Built for{" "}
			</Text>
			<TextAnimation.Rotating
				className="text-primary"
				phrases={WORDS}
				size="2xl"
				testID="text-animation-rotating"
				transition={{ kind: "slide" }}
				weight="semibold"
			/>
			<Text size="2xl" weight="semibold">
				{" "}
				teams
			</Text>
		</View>
	);
}
