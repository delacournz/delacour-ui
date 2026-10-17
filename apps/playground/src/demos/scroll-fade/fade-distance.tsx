import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Fade-in distance",
	caption:
		"How far the content travels before an edge is fully in. `0` is a step — the edge appears the moment there is anything past it; a long distance lets it arrive slowly. Separate from `size`, which is how deep the band is.",
};

const DISTANCES = [0, 24, 96] as const;

const LABELS: Record<(typeof DISTANCES)[number], string> = {
	0: "0 — a step",
	24: "24 — the default",
	96: "96 — slow",
};

const TILES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

function Row({ distance }: { distance: (typeof DISTANCES)[number] }): ReactElement {
	const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });

	return (
		<View className="gap-2">
			<Text.Caption>{LABELS[distance]}</Text.Caption>
			<ScrollFade fadeInDistance={distance} scrollSource={source} size={40}>
				<Animated.ScrollView
					contentContainerClassName="gap-2"
					horizontal
					showsHorizontalScrollIndicator={false}
					{...scrollProps}
				>
					{TILES.map((tile) => (
						<View className="h-14 w-14 items-center justify-center rounded-lg bg-secondary" key={tile}>
							<Text.Label>{tile}</Text.Label>
						</View>
					))}
				</Animated.ScrollView>
			</ScrollFade>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{DISTANCES.map((distance) => (
				<Row distance={distance} key={distance} />
			))}
		</View>
	);
}
