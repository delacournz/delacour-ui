import {
	TOGGLE_BUTTON_VARIANTS,
	ToggleButton,
	type ToggleButtonVariant,
} from "@delacour/react-native-ui/toggle-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"Each variant off and on. Every state is a button variant, so the fill, the label and any icon change together. Tap one to flip it.",
	align: "center",
	capture: { hero: true },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<ToggleButtonVariant, string> = {
	default: "Default",
	outline: "Outline",
	ghost: "Ghost",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{TOGGLE_BUTTON_VARIANTS.map((variant) => (
				<View className="flex-row gap-3" key={variant}>
					<ToggleButton className="w-32" testID={`variant-${variant}-off`} variant={variant}>
						{LABELS[variant]}
					</ToggleButton>
					<ToggleButton className="w-32" defaultSelected testID={`variant-${variant}-on`} variant={variant}>
						{LABELS[variant]}
					</ToggleButton>
				</View>
			))}
		</View>
	);
}
