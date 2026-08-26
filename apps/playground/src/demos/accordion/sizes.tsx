import { ACCORDION_SIZES, Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"One axis drives the row metrics, both type scales, the chevron's step, the panel's padding and the divider inset — so a panel's text starts on the same margin as the title above it at every size.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ACCORDION_SIZES.map((size) => (
				<Accordion defaultValue="one" key={size} size={size}>
					<Accordion.Item value="one">
						<Accordion.Trigger testID={`size-${size}`}>
							<Accordion.Title>size {size}</Accordion.Title>
							<Accordion.Description>Title, description and chevron all step with it</Accordion.Description>
						</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>The panel is inset to the trigger's own padding.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			))}
		</View>
	);
}
