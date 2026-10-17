import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reveal",
	capture: { align: "stretch", flow: "scroll-canvas/reveal" },
	caption:
		"A cover in the page's own colour retreats upward as the frame rises, uncovering the picture from its bottom edge. Here `start` and `end` run it from 85% down the view to just past the top.",
};

const COAST = require("../../../assets/scroll-canvas/coast.jpg");

const INTRO = [
	"The coast road climbs for an hour through regenerating bush.",
	"At the top there is a gravel pull-in and a view nobody warns you about.",
	"You walk the last stretch down through flax and cabbage trees.",
	"Round the headland the bay opens up all at once.",
];

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[560px] grow-0"
			contentContainerClassName="gap-4 pt-6 pb-[320px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-reveal"
			{...scrollProps}
		>
			{INTRO.map((line) => (
				<Text.Paragraph key={line}>{line}</Text.Paragraph>
			))}
			<ScrollCanvas
				accessibilityLabel="A bay below a forested headland"
				effect="reveal"
				scrollSource={source}
				source={COAST}
				end={-0.05}
				start={0.85}
			/>
			<Text.Paragraph>At low tide you can walk the whole beach without getting your feet wet.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
