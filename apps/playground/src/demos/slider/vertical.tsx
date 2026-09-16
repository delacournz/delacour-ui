import { Slider } from "@delacour/native-ui/slider";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	note: "The minimum is at the bottom. The inversion lives in valueFromOffset and in the sign of the thumb's translate, and nowhere else. A vertical slider needs a definite height from its parent — this row is h-56.",
	capture: { align: "stretch" },
};

const VERTICAL_COLORS = ["default", "success", "warning"] as const;

export function Demo(): ReactElement {
	return (
		<View className="h-56 flex-row justify-around">
			{VERTICAL_COLORS.map((color) => (
				<Slider color={color} defaultValue={45} key={color} orientation="vertical">
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb testID={`thumb-${color}`} />
					</Slider.Track>
				</Slider>
			))}
		</View>
	);
}
