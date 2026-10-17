import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollBlur } from "@delacour/react-native-ui/scroll-blur";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Layers and intensity",
	caption:
		"`layers` is how many strips approximate the ramp — two shows its steps, sixteen is smooth and costs sixteen native views. `intensity` is the blur at the edge, falling to nothing across the band.",
};

const TILES = ["#f43f5e", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6"] as const;

const SETTINGS = [
	{ id: "2-24", layers: 2, intensity: 24 },
	{ id: "8-56", layers: 8, intensity: 56 },
	{ id: "16-90", layers: 16, intensity: 90 },
] as const;

function Sample({ layers, intensity }: { layers: number; intensity: number }): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="flex-1 gap-2">
			<Text.Caption>{`${layers} · ${intensity}`}</Text.Caption>
			<ScrollBlur
				className="h-64"
				edges="end"
				intensity={intensity}
				layers={layers}
				scrollSource={source}
				size={120}
				tint={0.4}
			>
				<Animated.ScrollView contentContainerClassName="gap-2" {...scrollProps}>
					{TILES.map((color) => (
						<View className="h-14 rounded-md" key={color} style={{ backgroundColor: color }} />
					))}
				</Animated.ScrollView>
			</ScrollBlur>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="flex-row gap-2">
			{SETTINGS.map((setting) => (
				<Sample intensity={setting.intensity} key={setting.id} layers={setting.layers} />
			))}
		</View>
	);
}
