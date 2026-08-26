import { Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Steps and haptics",
	note: "A haptic ticks on grab and as the value crosses a step, gated on how far the drag has travelled — so a fine step scale reads as a cadence rather than a buzz. A continuous slider has no stop to land on and never ticks.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-2">
				<Text.Caption color="muted">step 10 — ticks on every stop</Text.Caption>
				<Slider defaultValue={40} step={10}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-step-10" />
					</Slider.Track>
				</Slider>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">step 1 — thinned to a cadence by distance travelled</Text.Caption>
				<Slider defaultValue={40}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-step-1" />
					</Slider.Track>
				</Slider>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">step 0 — continuous, and silent</Text.Caption>
				<Slider defaultValue={40} formatOptions={{ maximumFractionDigits: 1 }} step={0}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-step-0" />
					</Slider.Track>
				</Slider>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">step 10, haptic silenced</Text.Caption>
				<Slider defaultValue={40} haptic={false} step={10}>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-silent" />
					</Slider.Track>
				</Slider>
			</View>
		</View>
	);
}
