import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Resting states",
	align: "stretch",
	caption:
		"With Reduce Motion on, or `enabled={false}`, each effect draws its resting state: parallax centred, zoom at natural size, reveal uncovered, a sequence on frame 0. A still canvas needs no scroll source.",
};

const RIDGE = require("../../../assets/scroll-canvas/ridge.jpg");
const DUNES = require("../../../assets/scroll-canvas/dunes.jpg");
const COAST = require("../../../assets/scroll-canvas/coast.jpg");
const SPIN = [
	require("../../../assets/scroll-canvas/spin/frame-00.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-08.jpg"),
	require("../../../assets/scroll-canvas/spin/frame-16.jpg"),
];

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="flex-row gap-3">
				<View className="flex-1">
					<ScrollCanvas aspectRatio={1} enabled={false} source={RIDGE} />
				</View>
				<View className="flex-1">
					<ScrollCanvas aspectRatio={1} effect="zoom" enabled={false} source={DUNES} />
				</View>
			</View>
			<View className="flex-row gap-3">
				<View className="flex-1">
					<ScrollCanvas aspectRatio={1} effect="reveal" enabled={false} source={COAST} />
				</View>
				<View className="flex-1">
					<ScrollCanvas aspectRatio={1} effect="sequence" enabled={false} sources={SPIN} />
				</View>
			</View>
		</View>
	);
}
