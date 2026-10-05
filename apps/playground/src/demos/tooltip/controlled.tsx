import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`isOpen` and `onOpenChange` hand the state to the screen — here a second button shows the hint, and the tooltip still hides itself.",
	align: "center",
};

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
		<View className="items-center gap-6">
			<Tooltip isOpen={isOpen} onOpenChange={setOpen}>
				<Tooltip.Trigger asChild>
					<Button testID="tooltip-controlled-trigger" variant="secondary">
						Export
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<Tooltip.Arrow />
					<Tooltip.Text>Exports as CSV</Tooltip.Text>
				</Tooltip.Content>
			</Tooltip>
			<Button onPress={() => setOpen(true)} size="sm" testID="tooltip-controlled-show" variant="ghost">
				Show the hint
			</Button>
			<Text.Caption>{isOpen ? "Open" : "Closed"}</Text.Caption>
		</View>
	);
}
