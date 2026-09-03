import { SLIDER_SIZES, Slider } from "delacour-react-native-ui/slider";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The groove thickens and the thumb steps with it — one number per size drives both, which is what lets the fill land exactly on the track's end. The readout names a Text size rather than restating a type scale.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof SLIDER_SIZES)[number], string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{SLIDER_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Slider defaultValue={50} size={size}>
						<Slider.Output />
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb testID={`thumb-${size}`} />
						</Slider.Track>
					</Slider>
				</View>
			))}
		</View>
	);
}
