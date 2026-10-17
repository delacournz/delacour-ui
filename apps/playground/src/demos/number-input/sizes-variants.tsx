import { INPUT_SIZES, INPUT_VARIANTS, type InputSize, type InputVariant } from "@delacour/react-native-ui/input";
import { NumberInput } from "@delacour/react-native-ui/number-input";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"The box is `Input`'s, so it takes `Input`'s two variants and three sizes. A stepper is always as wide as the box is tall.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const VARIANT_LABELS: Record<InputVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
};

const SIZE_LABELS: Record<InputSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{INPUT_VARIANTS.map((variant) => (
				<View className="gap-3" key={variant}>
					<Text.Caption color="muted">{VARIANT_LABELS[variant]}</Text.Caption>
					{INPUT_SIZES.map((size) => (
						<NumberInput
							accessibilityLabel={`${VARIANT_LABELS[variant]}, ${SIZE_LABELS[size]}`}
							defaultValue={3}
							key={size}
							min={0}
							size={size}
							variant={variant}
						/>
					))}
				</View>
			))}
		</View>
	);
}
