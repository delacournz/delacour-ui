import { Button } from "@delacour/react-native-ui/button";
import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"Pass `isOpen` and the collapsible follows it; `onOpenChange` is where the trigger's press arrives. Here a button outside it drives the same state, and the line underneath reads it back.",
	capture: { align: "stretch", flow: "collapsible/controlled" },
};

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
		<View className="gap-3">
			<Collapsible isOpen={isOpen} onOpenChange={setOpen}>
				<Collapsible.Trigger testID="controlled-trigger">Delivery notes</Collapsible.Trigger>
				<Collapsible.Content>
					<Text.Paragraph>
						Leave it in the porch if nobody answers. The side gate sticks — lift it first.
					</Text.Paragraph>
				</Collapsible.Content>
			</Collapsible>
			<Button onPress={() => setOpen(!isOpen)} testID="controlled-button" variant="secondary">
				{isOpen ? "Hide notes" : "Show notes"}
			</Button>
			<Text.Caption testID="controlled-readout">{isOpen ? "Open" : "Closed"}</Text.Caption>
		</View>
	);
}
