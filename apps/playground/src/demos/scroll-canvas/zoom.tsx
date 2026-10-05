import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Zoom",
	align: "stretch",
	caption: "The picture enters oversized and settles to its natural size by the time the frame is 30% down the view.",
};

const DUNES = require("../../../assets/scroll-canvas/dunes.jpg");

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[480px]"
			contentContainerClassName="gap-4 py-[600px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-zoom"
			{...scrollProps}
		>
			<Text.Paragraph>Past the last fence line the sand starts to move with the wind.</Text.Paragraph>
			<ScrollCanvas
				accessibilityLabel="Dunes at sunset"
				distance={0.3}
				effect="zoom"
				scrollSource={source}
				source={DUNES}
			/>
			<Text.Paragraph>By evening the ridges have shifted a hand's width to the east.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
