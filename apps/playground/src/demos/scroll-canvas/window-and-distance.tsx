import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Window and distance",
	align: "stretch",
	caption:
		"`start` and `end` place the effect in viewport terms — where the frame's top sits when it begins and when it completes. `distance` is how far it goes. The canvases sit inside a nested view, measured against the scroller.",
};

const RIDGE = require("../../../assets/scroll-canvas/ridge.jpg");
const DUNES = require("../../../assets/scroll-canvas/dunes.jpg");

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView
			className="h-[480px]"
			contentContainerClassName="gap-4 py-[600px]"
			showsVerticalScrollIndicator={false}
			testID="scroll-canvas-window"
			{...scrollProps}
		>
			<View className="gap-2">
				<Text.Caption>Parallax, distance 0.4</Text.Caption>
				<ScrollCanvas distance={0.4} scrollSource={source} source={RIDGE} />
			</View>
			<View className="gap-2">
				<Text.Caption>Zoom, start 0.9 → end 0.6</Text.Caption>
				<ScrollCanvas effect="zoom" end={0.6} scrollSource={source} source={DUNES} start={0.9} />
			</View>
			<View className="gap-2">
				<Text.Caption>Zoom, a step at 0.5</Text.Caption>
				<ScrollCanvas effect="zoom" end={0.5} scrollSource={source} source={DUNES} start={0.5} />
			</View>
		</Animated.ScrollView>
	);
}
