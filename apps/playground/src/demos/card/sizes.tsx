import { Button } from "@delacour/react-native-ui/button";
import { CARD_SIZES, Card, type CardSize } from "@delacour/react-native-ui/card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"One axis for the inset, the gaps and the title and description scale. The insets are Surface's own padding steps, so a card and a surface side by side line up.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<CardSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{CARD_SIZES.map((size) => (
				<Card key={size} size={size} testID={`card-size-${size}`}>
					<Card.Header>
						<Card.Title>{LABELS[size]}</Card.Title>
						<Card.Description>Inset, gaps and type step together.</Card.Description>
					</Card.Header>
					<Card.Content>
						<Text.Caption>The body lines up with the header and the footer.</Text.Caption>
					</Card.Content>
					<Card.Footer>
						<Button size="sm" variant="secondary">
							Action
						</Button>
					</Card.Footer>
				</Card>
			))}
		</View>
	);
}
