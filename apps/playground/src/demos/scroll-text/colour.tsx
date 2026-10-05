import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colour",
	note: "The default effect: each word goes from muted-foreground to foreground as the block's top travels up the scroll view — a `window` of 0.75 to 0.05, tuned to this short box. Scroll back and it dims again — the scroll position is the clock.",
	capture: { align: "stretch", flow: "scroll-text/colour", hero: true },
};

const TEXT =
	"We build interfaces that move when you do. Every word waits its turn, and none of them is ever out of reach.";

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
			<View className="h-32" />
			<View className="px-5">
				<ScrollText size="2xl" weight="semibold" source={{ kind: "offset", scrollY, viewport }} window={WINDOW}>
					{TEXT}
				</ScrollText>
			</View>
			<View className="h-80" />
		</Animated.ScrollView>
	);
}
