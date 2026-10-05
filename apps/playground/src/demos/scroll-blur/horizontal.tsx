import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollBlur } from "@delacour/react-native-ui/scroll-blur";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A horizontal card row",
	caption:
		"The source fixes the axis, so a horizontal scrollable gets left and right bands with nothing else said. Both edges blur while there is a card past them.",
	align: "stretch",
};

const CARDS = [
	{ id: "tide", title: "Tide", color: "#0ea5e9" },
	{ id: "kiln", title: "Kiln", color: "#f97316" },
	{ id: "moss", title: "Moss", color: "#16a34a" },
	{ id: "plum", title: "Plum", color: "#9333ea" },
	{ id: "rose", title: "Rose", color: "#e11d48" },
	{ id: "sand", title: "Sand", color: "#ca8a04" },
] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });

	return (
		<ScrollBlur className="h-40" scrollSource={source} size={56}>
			<Animated.ScrollView
				contentContainerClassName="gap-3"
				horizontal
				showsHorizontalScrollIndicator={false}
				testID="scroll-blur-row"
				{...scrollProps}
			>
				{CARDS.map((card) => (
					<View className="h-40 w-32 justify-end rounded-lg p-3" key={card.id} style={{ backgroundColor: card.color }}>
						<Text.Header className="text-white">{card.title}</Text.Header>
					</View>
				))}
			</Animated.ScrollView>
		</ScrollBlur>
	);
}
