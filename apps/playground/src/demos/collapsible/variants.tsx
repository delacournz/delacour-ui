import { COLLAPSIBLE_VARIANTS, Collapsible, type CollapsibleVariant } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"The same four surfaces as `Accordion` and `ListGroup`, so the three sit together on one screen. The variant paints the surface alone — the row and the panel are unchanged in all four.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<CollapsibleVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{COLLAPSIBLE_VARIANTS.map((variant) => (
				<Collapsible key={variant} variant={variant}>
					<Collapsible.Trigger testID={`variant-${variant}`}>{LABELS[variant]}</Collapsible.Trigger>
					<Collapsible.Content>
						<Text.Paragraph>The surface is the root's. Everything inside it is unchanged.</Text.Paragraph>
					</Collapsible.Content>
				</Collapsible>
			))}
		</View>
	);
}
