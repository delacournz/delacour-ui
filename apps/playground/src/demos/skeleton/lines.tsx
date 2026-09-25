import { Skeleton } from "@delacour/react-native-ui/skeleton";
import { Slider } from "@delacour/react-native-ui/slider";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Lines",
	caption:
		"`Skeleton.Lines` draws a paragraph. Only the last line is shortened, and only when there are two or more — a single line is a title whose length you already know.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [lines, setLines] = useState(3);

	return (
		<View className="gap-6">
			<Slider maxValue={6} minValue={1} onChange={(next) => setLines(next as number)} step={1} value={lines}>
				<View className="flex-row items-center justify-between">
					<Text.Label>Lines</Text.Label>
					<Slider.Output />
				</View>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb testID="skeleton-lines-thumb" />
				</Slider.Track>
			</Slider>
			<Skeleton.Lines label="Loading article" lines={lines} />
		</View>
	);
}
