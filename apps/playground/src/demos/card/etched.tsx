import { Button } from "@delacour/react-native-ui/button";
import { Card } from "@delacour/react-native-ui/card";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Etched and tray",
	caption:
		'`material="etched"` sets a highlight into the card\'s edge. A `tray` is a muted frame that holds panels; the panels inside take the inner corner.',
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<Card className="rounded-2xl" material="etched">
				<Card.Header>
					<Card.Title>Etched card</Card.Title>
					<Card.Description>A highlight in the edge and a very soft drop.</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button material="etched" size="sm">
						Continue
					</Button>
				</Card.Content>
			</Card>

			<Surface material="tray">
				<Card material="etched">
					<Card.Header>
						<Card.Title>Inside a tray</Card.Title>
						<Card.Description>The tray's padding is 4pt; this panel takes the xl corner.</Card.Description>
					</Card.Header>
				</Card>
				<Text.Kicker className="px-3 py-2">Last synced 2 minutes ago</Text.Kicker>
			</Surface>
		</View>
	);
}
