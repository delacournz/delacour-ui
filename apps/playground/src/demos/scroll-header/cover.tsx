import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconChevronLeft, IconHeart } from "@delacour/react-native-ui/icons/central";
import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A cover that stretches",
	caption:
		"`ScrollHeader.Cover` sits behind the bar and the title, sized to end exactly where the first row starts. Pull down past the top and it grows from its top edge; scroll up and it leaves with the content while the bar's surface fades in over it.",
	capture: { frame: "device", flow: "scroll-header/cover" },
};

const COVER = { uri: "https://picsum.photos/id/1018/1200/800" };

const STOPS = [
	{ id: "hut", title: "Hut to hut", detail: "Three days along the ridge line" },
	{ id: "lake", title: "The lake track", detail: "Flat, shaded, and busy at noon" },
	{ id: "saddle", title: "Over the saddle", detail: "Steep for an hour, then the view" },
	{ id: "river", title: "Down the river", detail: "Two swing bridges and a ford" },
	{ id: "summit", title: "The summit spur", detail: "An out-and-back before breakfast" },
	{ id: "bush", title: "Through the bush", detail: "Beech forest and birdsong" },
	{ id: "coast", title: "Back to the coast", detail: "The last stretch on sand" },
	{ id: "campsite", title: "The campsite", detail: "Water, a long-drop and a fire pit" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader>
				<ScrollHeader.Cover source={COVER} />
				<ScrollHeader.Bar>
					<Button accessibilityLabel="Back" size="icon-sm" variant="secondary">
						<Icon icon={IconChevronLeft} />
					</Button>
					<ScrollHeader.BarTitle>Ridge walk</ScrollHeader.BarTitle>
					<View className="ml-auto">
						<Button accessibilityLabel="Save" size="icon-sm" variant="secondary">
							<Icon icon={IconHeart} />
						</Button>
					</View>
				</ScrollHeader.Bar>
				<ScrollHeader.Large className="pt-24">
					<Text.Title className="text-white">Ridge walk</Text.Title>
					<Text.Caption className="text-white/80">Four days · 42 km</Text.Caption>
				</ScrollHeader.Large>
				<ScrollHeader.ScrollView
					contentContainerClassName="gap-4 px-screen-gutter pt-4 pb-12"
					testID="scroll-header-cover"
				>
					{STOPS.map((stop) => (
						<View className="gap-1" key={stop.id}>
							<Text.Label>{stop.title}</Text.Label>
							<Text.Caption>{stop.detail}</Text.Caption>
						</View>
					))}
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
