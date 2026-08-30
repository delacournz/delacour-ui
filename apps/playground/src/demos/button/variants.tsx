import { BUTTON_VARIANTS, Button, type ButtonVariant } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption: "Every variant, at rest. Each one presses differently — hold one down to see it.",
	capture: { align: "stretch", hero: true },
};

/**
 * Written out rather than title-cased from the value.
 *
 * A `Record` keyed on the variant type is exhaustive, so adding a variant to
 * the library fails this file's typecheck until it is given a label — where
 * mapping the raw value would have quietly rendered `danger-soft` at a user.
 */
const LABELS: Record<ButtonVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
	tertiary: "Tertiary",
	outline: "Outline",
	ghost: "Ghost",
	danger: "Danger",
	"danger-soft": "Danger Soft",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_VARIANTS.map((variant) => (
				<Button key={variant} testID={`variant-${variant}`} variant={variant}>
					{LABELS[variant]}
				</Button>
			))}
		</View>
	);
}
