import { SLIDE_BUTTON_VARIANTS, SlideButton, type SlideButtonVariant } from "@delacour/react-native-ui/slide-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`secondary`, `destructive` and `success`. The handle stays neutral in every one; only the rail, the trail and the label take the colour.",
	align: "center",
	capture: { flow: "slide-button/variants" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SlideButtonVariant, string> = {
	secondary: "Slide to archive",
	destructive: "Slide to delete",
	success: "Slide to pay",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SLIDE_BUTTON_VARIANTS.map((variant) => (
				<SlideButton isAutoReset key={variant} testID={`variant-${variant}`} variant={variant}>
					<SlideButton.Label>{LABELS[variant]}</SlideButton.Label>
					<SlideButton.Thumb testID={`variant-${variant}-thumb`} />
				</SlideButton>
			))}
		</View>
	);
}
