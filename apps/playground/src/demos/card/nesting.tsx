import { Card, useCard } from "@delacour/react-native-ui/card";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nesting",
	caption:
		"Neither card names a variant. The inner one steps to the next fill from the card it sits in, and its band footer steps once more — so nothing vanishes into its parent.",
};

/** Names the fill the card around it resolved to — read from context, not passed down. */
function FillLabel(): ReactElement {
	const { variant } = useCard();
	return <Text.Caption testID={`card-nesting-fill-${variant}`}>On the {variant} fill</Text.Caption>;
}

export function Demo(): ReactElement {
	const [isNotifying, setNotifying] = useState(true);

	return (
		<Card testID="card-nesting-outer">
			<Card.Header>
				<Card.Title>Deployments</Card.Title>
				<Card.Description>Production, last seven days.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Card size="sm" testID="card-nesting-inner">
					<Card.Header>
						<Card.Title>Failure alerts</Card.Title>
						<Card.Action>
							<Switch
								accessibilityLabel="Failure alerts"
								isSelected={isNotifying}
								onSelectedChange={setNotifying}
								size="sm"
								testID="card-nesting-toggle"
							/>
						</Card.Action>
					</Card.Header>
					<Card.Content>
						<Text.Caption testID="card-nesting-status">
							{isNotifying ? "The on-call engineer is paged." : "Nobody is paged."}
						</Text.Caption>
					</Card.Content>
					<Card.Footer variant="band">
						<FillLabel />
					</Card.Footer>
				</Card>
			</Card.Content>
			<Card.Footer>
				<View className="flex-1">
					<FillLabel />
				</View>
			</Card.Footer>
		</Card>
	);
}
