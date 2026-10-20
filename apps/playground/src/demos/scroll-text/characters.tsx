import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Characters",
	note: "One unit per grapheme, grouped per word so a word never breaks mid-glyph. A low overlap makes the stagger read as typing.",
	capture: { align: "stretch", flow: "scroll-text/characters" },
};

const TEXT = "Letter by letter.";

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
			<View className="h-64" />
			<View className="px-5">
				<ScrollText
					effect={{ kind: "fade" }}
					overlap={0.1}
					size="3xl"
					split="character"
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
