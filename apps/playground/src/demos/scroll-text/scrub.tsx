import { ScrollText } from "@delacour/react-native-ui/scroll-text";
import { Slider } from "@delacour/react-native-ui/slider";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrub",
	note: "A progress source skips the geometry entirely: the shared value is already 0..1, so anything can drive it — here a Slider, with no scrolling at all.",
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	const progress = useSharedValue(0.3);

	const handleChange = (value: number | number[]): void => {
		progress.value = (Array.isArray(value) ? (value[0] ?? 0) : value) / 100;
	};

	return (
		<View className="gap-8">
			<ScrollText size="2xl" source={{ kind: "progress", progress }} weight="semibold">
				The same text, by hand. Drag to resolve it word by word.
			</ScrollText>
			<Slider defaultValue={30} onChange={handleChange}>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb testID="scroll-text-scrub" />
				</Slider.Track>
			</Slider>
		</View>
	);
}
