import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Rise",
	note: "Words lift 16 points and fade up from a 0.15 floor. The floor is a minimum: un-revealed text stays legible.",
	capture: { align: "stretch", flow: true },
};

const TEXT = "Every word arrives on time.";

/** Tuned to the 320pt box: the block starts resolving three quarters down it and finishes near its top. */
const WINDOW = { start: 0.75, end: 0.05 };

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
			<View className="h-52" />
			<View className="px-5">
				<ScrollText
					effect={{ kind: "rise", distance: 16 }}
					size="3xl"
					weight="bold"
					source={{ kind: "offset", scrollY, viewport }}
					window={WINDOW}
				>
					{TEXT}
				</ScrollText>
			</View>
			<View className="h-80" />
		</Animated.ScrollView>
	);
}
