import { CircularText } from "@delacour/react-native-ui/circular-text";
import { Slider } from "@delacour/react-native-ui/slider";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		'`spin={{ kind: "controlled", rotation }}` hands the angle to the app — a scroll offset, a gesture, or here a slider. There is no clock, and reduce motion leaves it alone: the caller owns the movement.',
	capture: { align: "stretch", flow: "circular-text/controlled" },
};

export function Demo(): ReactElement {
	const rotation = useSharedValue(0);

	return (
		<View className="items-center gap-8">
			<CircularText radius={64} repeat="fill" spin={{ kind: "controlled", rotation }}>
				TURN THE DIAL
			</CircularText>
			<View className="self-stretch">
				<Slider
					accessibilityLabel="Rotation"
					defaultValue={0}
					maxValue={360}
					onChange={(value) => {
						rotation.value = Array.isArray(value) ? (value[0] ?? 0) : value;
					}}
				>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="circular-text-dial" />
					</Slider.Track>
				</Slider>
			</View>
		</View>
	);
}
