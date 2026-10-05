import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reveal",
	caption:
		"A cover in the page's own colour retreats upward as the frame rises, uncovering the picture from its bottom edge.",
};

const COAST = require("../../../assets/scroll-canvas/coast.jpg");

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[460px]"
			contentContainerClassName="gap-4 pt-[300px] pb-[300px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-reveal"
			{...scrollProps}
		>
			<Text.Paragraph>Round the headland the bay opens up all at once.</Text.Paragraph>
			<ScrollCanvas
				accessibilityLabel="A bay below a forested headland"
				effect="reveal"
				scrollSource={source}
				source={COAST}
			/>
			<Text.Paragraph>At low tide you can walk the whole beach without getting your feet wet.</Text.Paragraph>
		</Animated.ScrollView>
	);
}
