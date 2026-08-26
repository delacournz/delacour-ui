import { Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and invalid",
	note: "Invalid outranks the colour, on the fill, the way it does on a checkbox's border.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-2">
				<Text.Caption color="muted">isDisabled</Text.Caption>
				<Slider defaultValue={40} isDisabled>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-disabled" />
					</Slider.Track>
				</Slider>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">isInvalid, over a colour</Text.Caption>
				<Slider color="success" defaultValue={70} isInvalid>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID="thumb-invalid" />
					</Slider.Track>
				</Slider>
			</View>
		</View>
	);
}
