import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { Input } from "@delacour/react-native-ui/input";
import { ScrollBlur } from "@delacour/react-native-ui/scroll-blur";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A search field over media",
	caption:
		'`edges="start"` under a sticky field. The band is clear at rest and arrives over the first `fadeInDistance` points of travel, so the top row is crisp until it starts to pass under the field.',
	align: "stretch",
	keyboardAware: true,
};

const TILES = [
	"#0ea5e9",
	"#f43f5e",
	"#a855f7",
	"#10b981",
	"#f59e0b",
	"#6366f1",
	"#14b8a6",
	"#e11d48",
	"#84cc16",
	"#d946ef",
	"#f97316",
	"#0284c7",
] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="h-[440px] overflow-hidden rounded-lg">
			<ScrollBlur className="flex-1" edges="start" insetStart={0} scrollSource={source} size={96}>
				<Animated.ScrollView
					contentContainerClassName="flex-row flex-wrap gap-2 pt-16"
					testID="scroll-blur-media"
					{...scrollProps}
				>
					{TILES.map((color) => (
						<View className="aspect-square w-[48.5%] rounded-lg" key={color} style={{ backgroundColor: color }} />
					))}
				</Animated.ScrollView>
			</ScrollBlur>
			<View className="absolute inset-x-0 top-0 p-2">
				<Input inputMode="search" placeholder="Search photos" />
			</View>
		</View>
	);
}
