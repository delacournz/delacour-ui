import { AnimatedBadge } from "@delacour/react-native-ui/animated-badge";
import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside text",
	caption: "With `animateLayout={false}` the badge stays in its place in the sentence as the words around it reflow.",
	capture: { flow: "animated-badge/inline-text", align: "stretch" },
};

const BEFORE = "This listing has".split(" ");
const AFTER = "from verified buyers this month.".split(" ");

export function Demo(): ReactElement {
	const [count, setCount] = useState(8);

	return (
		<View className="gap-4">
			<View className="flex-row flex-wrap items-center gap-x-1 gap-y-1.5">
				{BEFORE.map((word) => (
					<Text.Paragraph key={`before-${word}`}>{word}</Text.Paragraph>
				))}
				<AnimatedBadge animateLayout={false} announce={false} showIcon={false} size="sm" status="info">
					{`${count} reviews`}
				</AnimatedBadge>
				{AFTER.map((word) => (
					<Text.Paragraph key={`after-${word}`}>{word}</Text.Paragraph>
				))}
			</View>
			<Button
				className="self-start"
				onPress={() => setCount((value) => (value < 1000 ? value * 7 : 8))}
				size="sm"
				testID="more-reviews"
				variant="secondary"
			>
				More reviews
			</Button>
		</View>
	);
}
