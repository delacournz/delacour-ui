import { SLIDE_BUTTON_SIZES, SlideButton, type SlideButtonSize } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"`sm`, `md` and `lg` — the same heights and corners as a button at each size, so a slide button stacks level with one. The handle is measured from the rail.",
	align: "center",
	capture: {},
};

const LABELS: Record<SlideButtonSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SLIDE_BUTTON_SIZES.map((size) => (
				<SlideButton isAutoReset key={size} size={size} testID={`size-${size}`}>
					<SlideButton.Label>{LABELS[size]}</SlideButton.Label>
				</SlideButton>
			))}
		</View>
	);
}
