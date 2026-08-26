import { Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, and onChangeEnd",
	note: "onChange fires throughout the drag. That is where a network write belongs.",
};

export function Demo(): ReactElement {
	const [volume, setVolume] = useState(30);
	const [settled, setSettled] = useState<number | number[]>(30);

	return (
		<View className="gap-3">
			<Slider onChange={(next) => setVolume(next as number)} onChangeEnd={setSettled} value={volume}>
				<View className="flex-row items-center justify-between">
					<Text.Label>Volume</Text.Label>
					<Slider.Output />
				</View>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb testID="thumb-volume" />
				</Slider.Track>
			</Slider>
			<Text.Caption>{`onChangeEnd fired last with ${String(settled)}`}</Text.Caption>
		</View>
	);
}
