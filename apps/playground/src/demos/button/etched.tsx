import { BUTTON_VARIANTS, Button, type ButtonVariant } from "@delacour/react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Etched",
	caption:
		'`material="etched"` sets a one-pixel highlight into the fill\'s edge. Primary takes a white inset top edge; ghost and destructive stay flat.',
	align: "stretch",
};

const LABELS: Record<ButtonVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
	tertiary: "Tertiary",
	outline: "Outline",
	ghost: "Ghost",
	destructive: "Destructive",
	"destructive-soft": "Destructive Soft",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_VARIANTS.map((variant) => (
				<Button key={variant} material="etched" testID={`etched-${variant}`} variant={variant}>
					{LABELS[variant]}
				</Button>
			))}
		</View>
	);
}
