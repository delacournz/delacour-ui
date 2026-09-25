import { Card } from "@delacour/react-native-ui/card";
import { SURFACE_VARIANTS, type SurfaceVariant } from "@delacour/react-native-ui/surface";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"A card takes Surface's four fills. `default` is hairlined so it holds its edge on the page; the title follows the fill's own foreground token.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SURFACE_VARIANTS.map((variant) => (
				<Card key={variant} testID={`card-variant-${variant}`} variant={variant}>
					<Card.Header>
						<Card.Title>{LABELS[variant]}</Card.Title>
						<Card.Description>A card on the {LABELS[variant].toLowerCase()} fill.</Card.Description>
					</Card.Header>
				</Card>
			))}
		</View>
	);
}
