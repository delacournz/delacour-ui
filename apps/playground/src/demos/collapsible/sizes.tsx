import { COLLAPSIBLE_SIZES, Collapsible, type CollapsibleSize } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"One axis drives the row's height, both type scales, the chevron's step and the panel's padding — so the panel's text starts on the same margin as the title above it at every size.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<CollapsibleSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{COLLAPSIBLE_SIZES.map((size) => (
				<Collapsible defaultOpen key={size} size={size}>
					<Collapsible.Trigger testID={`size-${size}`}>
						<Collapsible.Title>{LABELS[size]}</Collapsible.Title>
						<Collapsible.Description>Title, description and chevron all step with it</Collapsible.Description>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Text.Paragraph>The panel is inset to the trigger's own padding.</Text.Paragraph>
					</Collapsible.Content>
				</Collapsible>
			))}
		</View>
	);
}
