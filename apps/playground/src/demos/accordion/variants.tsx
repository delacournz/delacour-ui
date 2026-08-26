import { ACCORDION_VARIANTS, Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`ListGroup`'s set, because an accordion is the same kind of thing and the two sit beside each other on a screen. The variant paints the root alone — a trigger and a panel look the same in all four.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ACCORDION_VARIANTS.map((variant) => (
				<Accordion key={variant} variant={variant}>
					<Accordion.Item value="one">
						<Accordion.Trigger testID={`variant-${variant}`}>
							<Accordion.Title>{variant}</Accordion.Title>
						</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>The surface is the root's. Everything inside it is unchanged.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item value="two">
						<Accordion.Trigger>Second row</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>So the divider between them is visible too.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			))}
		</View>
	);
}
