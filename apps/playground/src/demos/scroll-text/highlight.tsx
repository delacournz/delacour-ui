import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Highlight",
	note: "The default band is primary at 20%, fading in from its own colour at zero alpha so it never passes through grey.",
	capture: { align: "stretch", flow: "scroll-text/highlight" },
};

const TEXT = "A marker band sweeps through the sentence as you reach it, one word after the next.";

export function Demo(): ReactElement {
	const scrollY = useSharedValue(0);
	const viewport = useAnimatedRef<Animated.ScrollView>();
	const onScroll = useAnimatedScrollHandler((event) => {
		scrollY.value = event.contentOffset.y;
	});

	return (
		<Animated.ScrollView
			className="h-80 rounded-2xl border border-border"
			onScroll={onScroll}
			ref={viewport}
			scrollEventThrottle={16}
			testID="scroll-text-host"
		>
			<View className="h-60" />
			<View className="px-5">
				<ScrollText
					effect={{ kind: "highlight" }}
					size="xl"
					overlap={0.2}
					source={{ kind: "offset", scrollY, viewport }}
				>
					{TEXT}
				</ScrollText>
			</View>
			<View className="h-80" />
		</Animated.ScrollView>
	);
}
