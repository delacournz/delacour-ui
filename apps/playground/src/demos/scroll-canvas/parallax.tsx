import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Parallax",
	align: "stretch",
	caption:
		"The frame scrolls with the page; the picture inside it drifts more slowly, so it seems to sit further away. It never shows a frame edge at either end of its travel.",
};

const RIDGE = require("../../../assets/scroll-canvas/ridge.jpg");

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[480px]"
			contentContainerClassName="gap-4 py-[600px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-parallax"
			{...scrollProps}
		>
			<Text.Paragraph>Above the ridge the fog lifts slowly, and the light comes in sideways.</Text.Paragraph>
			<ScrollCanvas accessibilityLabel="Fog over a mountain ridge at dawn" scrollSource={source} source={RIDGE} />
			<Text.Paragraph>The track drops into beech forest after the saddle and stays there until the hut.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
