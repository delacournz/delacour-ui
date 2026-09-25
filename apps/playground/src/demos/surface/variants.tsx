import { SURFACE_VARIANTS, Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"Four fills, one ladder. `default` is the card, hairlined so it holds its edge on the page; `secondary` and `tertiary` are the fills beneath it; `transparent` keeps the padding and the corner and paints nothing.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof SURFACE_VARIANTS)[number], string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SURFACE_VARIANTS.map((variant) => (
				<Surface key={variant} testID={`surface-${variant}`} variant={variant}>
					<Text.Label>{LABELS[variant]}</Text.Label>
					<Text.Caption>A surface on the {variant} fill.</Text.Caption>
				</Surface>
			))}
		</View>
	);
}
