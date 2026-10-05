import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollBlur, ScrollBlurLayerProvider } from "@delacour/react-native-ui/scroll-blur";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Blur against a plain fade",
	caption:
		"The same coloured list twice. On the left the band has no engine, so it is a gradient into the page colour — over tiles that are not the page colour it reads as a grey band. On the right the blur keeps each tile's colour and drops only its detail.",
	align: "stretch",
};

const TILES = ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"] as const;

function Column({ label }: { label: string }): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="flex-1 gap-2">
			<Text.Label>{label}</Text.Label>
			<ScrollBlur className="h-80" edges="end" scrollSource={source} size={96}>
				<Animated.ScrollView contentContainerClassName="gap-2" {...scrollProps}>
					{TILES.map((color) => (
						<View className="h-16 rounded-lg" key={color} style={{ backgroundColor: color }} />
					))}
				</Animated.ScrollView>
			</ScrollBlur>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-row gap-3">
			<ScrollBlurLayerProvider layer={null}>
				<Column label="Fade" />
			</ScrollBlurLayerProvider>
			<Column label="Blur" />
		</View>
	);
}
