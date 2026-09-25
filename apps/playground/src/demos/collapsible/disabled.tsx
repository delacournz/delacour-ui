import { Collapsible } from "@delacour/react-native-ui/collapsible";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption:
		"`isDisabled` fades the surface and stops the trigger in both directions. A section that was open stays open — a disabled control cannot be used, but it does not undo itself.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Collapsible isDisabled>
				<Collapsible.Trigger testID="disabled-closed">Closed, and staying closed</Collapsible.Trigger>
				<Collapsible.Content>
					<Text.Paragraph>Unreachable.</Text.Paragraph>
				</Collapsible.Content>
			</Collapsible>
			<Collapsible defaultOpen isDisabled>
				<Collapsible.Trigger testID="disabled-open">Open, and staying open</Collapsible.Trigger>
				<Collapsible.Content>
					<Text.Paragraph>Still on screen and still read out — it just cannot be closed.</Text.Paragraph>
				</Collapsible.Content>
			</Collapsible>
		</View>
	);
}
