import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sequence",
	capture: { align: "stretch", flow: true },
	caption:
		"Twenty-four frames, scrubbed by the scroll: each band of progress shows one of them, with no cross-fade. At rest above its window — here 40% down the view to just past the top — it shows frame 0, the poster.",
	note: "Every frame is mounted at once, so keep a sequence to 20–30 frames at the size it is drawn.",
};

const SPIN = [
	require("../../../assets/scroll-canvas/spin/frame-00.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-01.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-02.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-03.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-04.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-05.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-06.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-07.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-08.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-09.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-10.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-11.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-12.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-13.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-14.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-15.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-16.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-17.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-18.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-19.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-20.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-21.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-22.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-23.jpg"),
];

const INTRO = [
	"The dial is drawn twenty-four times, fifteen degrees apart.",
	"Each band of scroll shows exactly one of them.",
	"There is no blending between frames, so a slow drag lands on one.",
	"Scroll slowly and the dial turns a full revolution.",
];

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[560px] grow-0"
			contentContainerClassName="gap-4 pt-6 pb-[320px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-sequence"
			{...scrollProps}
		>
			{INTRO.map((line) => (
				<Text.Paragraph key={line}>{line}</Text.Paragraph>
			))}
			<ScrollCanvas
				accessibilityLabel="A turning dial"
				effect="sequence"
				scrollSource={source}
				sources={SPIN}
				end={-0.05}
				start={0.4}
			/>
			<Text.Paragraph>Scroll back and it turns the other way.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
