import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Zoom",
	capture: { align: "stretch", flow: "scroll-canvas/zoom" },
	caption:
		"The picture starts oversized and settles to its natural size as the frame rises. Here `start` and `end` run the effect from 45% down the view to just past the top.",
};

const DUNES = require("../../../assets/scroll-canvas/dunes.jpg");

const INTRO = [
	"The road gives out a few kilometres past the last farm gate.",
	"From there it is sand, and then more sand, all the way to the coast.",
	"Nobody lives out here, though the old fence posts say somebody tried.",
	"Past the last fence line the sand starts to move with the wind.",
];

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[560px] grow-0"
			contentContainerClassName="gap-4 pt-6 pb-[320px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-zoom"
			{...scrollProps}
		>
			{INTRO.map((line) => (
				<Text.Paragraph key={line}>{line}</Text.Paragraph>
			))}
			<ScrollCanvas
				accessibilityLabel="Dunes at sunset"
				distance={0.35}
				effect="zoom"
				scrollSource={source}
				source={DUNES}
				end={-0.05}
				start={0.45}
			/>
			<Text.Paragraph>By evening the ridges have shifted a hand's width to the east.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
