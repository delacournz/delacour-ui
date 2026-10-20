import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A frosted bar over media",
	caption:
		'`surface="blur"` draws the engine `ScrollBlurLayerProvider` names behind a light wash, so the tiles stay visible, defocused, under the bar. With no engine, or with Reduce Transparency on, it is the plain surface instead.',
	capture: { frame: "device", flow: true },
};

const TILES = [
	["#0ea5e9", "#f43f5e"],
	["#a855f7", "#10b981"],
	["#f59e0b", "#6366f1"],
	["#14b8a6", "#e11d48"],
	["#84cc16", "#d946ef"],
	["#f97316", "#0284c7"],
	["#22c55e", "#ec4899"],
	["#eab308", "#8b5cf6"],
] as const;

export function Demo(): ReactElement {
	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader>
				<ScrollHeader.Bar surface="blur">
					<ScrollHeader.BarTitle>Photos</ScrollHeader.BarTitle>
				</ScrollHeader.Bar>
				<ScrollHeader.Large>
					<Text.Title>Photos</Text.Title>
					<Text.Caption>Summer, 2026</Text.Caption>
				</ScrollHeader.Large>
				<ScrollHeader.ScrollView contentContainerClassName="gap-2 px-screen-gutter pb-12" testID="scroll-header-blur">
					{TILES.map((pair) => (
						<View className="flex-row gap-2" key={pair[0]}>
							{pair.map((color) => (
								<View className="aspect-square flex-1 rounded-lg" key={color} style={{ backgroundColor: color }} />
							))}
						</View>
					))}
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
