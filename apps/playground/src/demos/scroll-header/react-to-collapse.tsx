import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import Animated, { interpolate, type SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reacting to the collapse",
	caption:
		"`progress` is written every frame — here it shrinks the avatar in the bar as it fades in. `onCollapsedChange` fires once per crossing, on the JS thread — here it swaps the bar's button for a compact one once the full-size button has scrolled away.",
	capture: { frame: "device", flow: "scroll-header/react-to-collapse" },
};

const POSTS = [
	{ id: "p1", title: "Field notes from the coast", detail: "2 days ago" },
	{ id: "p2", title: "On walking slowly", detail: "1 week ago" },
	{ id: "p3", title: "A list of good bridges", detail: "2 weeks ago" },
	{ id: "p4", title: "Rain, again", detail: "3 weeks ago" },
	{ id: "p5", title: "The map is not the track", detail: "1 month ago" },
	{ id: "p6", title: "Packing for four days", detail: "1 month ago" },
	{ id: "p7", title: "Huts I have slept in", detail: "2 months ago" },
	{ id: "p8", title: "Why I carry a trowel", detail: "2 months ago" },
] as const;

function BarAvatar({ progress }: { progress: SharedValue<number> }): ReactElement {
	const style = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1]) }],
	}));

	return (
		<Animated.View style={style}>
			<Avatar name="Mere Tane" size="sm" source={{ uri: "https://i.pravatar.cc/160?img=47" }} />
		</Animated.View>
	);
}

export function Demo(): ReactElement {
	const progress = useSharedValue(0);
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader onCollapsedChange={setIsCollapsed} progress={progress}>
				<ScrollHeader.Bar>
					<BarAvatar progress={progress} />
					<ScrollHeader.BarTitle>Mere Tane</ScrollHeader.BarTitle>
					<View className="ml-auto">
						{isCollapsed ? (
							<Button size="sm" testID="scroll-header-follow-compact">
								<Button.Label>Follow</Button.Label>
							</Button>
						) : null}
					</View>
				</ScrollHeader.Bar>
				<ScrollHeader.Large>
					<Text.Title>Mere Tane</Text.Title>
					<Text.Caption>Walks, huts and the occasional bridge</Text.Caption>
				</ScrollHeader.Large>
				<ScrollHeader.ScrollView
					contentContainerClassName="gap-4 px-screen-gutter pb-12"
					testID="scroll-header-profile"
				>
					<Button testID="scroll-header-follow">
						<Button.Label>Follow</Button.Label>
					</Button>
					{POSTS.map((post) => (
						<View className="gap-1" key={post.id}>
							<Text.Label>{post.title}</Text.Label>
							<Text.Caption>{post.detail}</Text.Caption>
						</View>
					))}
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
