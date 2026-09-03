import { SLIDER_COLORS, Slider } from "delacour-react-native-ui/slider";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	note: "The colour paints the fill and the handle's capsule with one token, so the two meet with no seam. The knob takes that colour's foreground — which is why it is white on info and near-black on warning.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof SLIDER_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{SLIDER_COLORS.map((color) => (
				<View className="gap-2" key={color}>
					<Text.Caption color="muted">{LABELS[color]}</Text.Caption>
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
