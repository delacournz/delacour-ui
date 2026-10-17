import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Parallax",
	capture: { align: "stretch", flow: "scroll-canvas/parallax", hero: true },
	caption:
		"The frame scrolls with the page; the picture inside it drifts more slowly, so it seems to sit further away. It never shows a frame edge at either end of its travel.",
};

const RIDGE = require("../../../assets/scroll-canvas/ridge.jpg");

const INTRO = [
	"The hut sits on a shelf above the bushline, a long day's walk from the road.",
	"We left before first light, head torches on, the track still frozen hard.",
	"By the second saddle the cloud had settled into the valley below us.",
	"Above the ridge the fog lifts slowly, and the light comes in sideways.",
];

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[560px] grow-0"
			contentContainerClassName="gap-4 pt-6 pb-[320px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-parallax"
			{...scrollProps}
		>
			{INTRO.map((line) => (
				<Text.Paragraph key={line}>{line}</Text.Paragraph>
			))}
			<ScrollCanvas
				accessibilityLabel="Fog over a mountain ridge at dawn"
				distance={0.3}
				scrollSource={source}
				source={RIDGE}
			/>
			<Text.Paragraph>The track drops into beech forest after the saddle and stays there until the hut.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
