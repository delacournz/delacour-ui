import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A row of cards",
	caption:
		'The axis belongs to the source: `useScrollSource({ orientation: "horizontal" })` and the bands stand at the left and right edges instead.',
};

const CARDS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });

	return (
		<ScrollFade scrollSource={source} size={40}>
			<Animated.ScrollView
				contentContainerClassName="gap-3 px-4"
				horizontal
				showsHorizontalScrollIndicator={false}
				testID="scroll-fade-horizontal"
				{...scrollProps}
			>
				{CARDS.map((day) => (
					<View className="h-28 w-28 items-center justify-center rounded-xl bg-secondary" key={day}>
						<Text.Label>{day}</Text.Label>
					</View>
				))}
			</Animated.ScrollView>
		</ScrollFade>
	);
}
