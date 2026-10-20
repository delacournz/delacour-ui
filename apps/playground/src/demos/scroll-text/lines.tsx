import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Lines",
	note: "A hidden full Text reports its lines; each becomes a single-line unit, so the breaks match a plain Text exactly.",
	capture: { align: "stretch", flow: true },
};

const TEXT =
	"Line by line, a paragraph resolves as it climbs the screen. The lines are the ones a plain Text of the same string would break into, measured once and re-measured only when the width changes.";

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
			<View className="h-28" />
			<View className="px-5">
				<ScrollText
					effect={{ kind: "rise", distance: 10 }}
					size="lg"
					split="line"
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
