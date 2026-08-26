import { SLIDER_COLORS, Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	note: "The colour paints the fill and the handle's capsule with one token, so the two meet with no seam. The knob takes that colour's foreground — which is why it is white on info and near-black on warning.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{SLIDER_COLORS.map((color) => (
				<View className="gap-2" key={color}>
					<Text.Caption color="muted">{color}</Text.Caption>
					<Slider color={color} defaultValue={65}>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb testID={`thumb-${color}`} />
						</Slider.Track>
					</Slider>
				</View>
			))}
		</View>
	);
}
