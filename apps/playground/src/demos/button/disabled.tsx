import { BUTTON_VARIANTS, Button, type ButtonVariant } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "`isDisabled` fades the button and blocks the press, on every variant.",
	capture: { align: "stretch" },
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
				<Button isDisabled key={variant} testID={`disabled-${variant}`} variant={variant}>
					{LABELS[variant]}
				</Button>
			))}
		</View>
	);
}
