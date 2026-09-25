import { Field } from "@delacour/react-native-ui/field";
import { INPUT_VARIANTS, type InputVariant } from "@delacour/react-native-ui/input";
import { Textarea } from "@delacour/react-native-ui/textarea";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption: "The box is `Input`'s, so the two variants are too — a bordered card, and a filled one with no border.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const LABELS: Record<InputVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_VARIANTS.map((variant) => (
				<Field key={variant}>
					<Field.Label>{LABELS[variant]}</Field.Label>
					<Textarea placeholder="Write a few lines" rows={3} testID={`variant-${variant}`} variant={variant} />
				</Field>
			))}
		</View>
	);
}
