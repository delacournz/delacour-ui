import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollBlur, ScrollBlurLayerProvider } from "@delacour/react-native-ui/scroll-blur";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The gradient fallback",
	caption:
		"A `ScrollBlurLayerProvider` with `layer={null}` turns the engine off for its subtree, which is what an app without `expo-blur` gets everywhere — and what Reduce Transparency gets on iOS. The band becomes a gradient into the page colour, solid at the edge.",
};

const ROWS = ["Inbox", "Drafts", "Sent", "Archive", "Spam", "Trash", "Starred", "Snoozed", "Scheduled", "All mail"];

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<ScrollBlurLayerProvider layer={null}>
			<ScrollBlur className="h-80" scrollSource={source} size={64}>
				<Animated.ScrollView {...scrollProps}>
					{ROWS.map((row) => (
						<View className="border-border border-b py-3" key={row}>
							<Text.Paragraph>{row}</Text.Paragraph>
						</View>
					))}
				</Animated.ScrollView>
			</ScrollBlur>
		</ScrollBlurLayerProvider>
	);
}
