import { ContextMenu } from "@delacour/react-native-ui/context-menu";
import { IconBellOff, IconPin, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With its own press",
	caption:
		"A tap opens the thread; a hold opens the menu. One recogniser decides which, so a hold never also counts as a tap.",
	note: "Put onPress on the trigger, not on a pressable inside it — an inner press would race the hold instead of being arbitrated against it.",
};

export function Demo(): ReactElement {
	const [opened, setOpened] = useState(0);
	const [last, setLast] = useState("None");

	return (
		<View className="gap-3">
			<ContextMenu>
				<ContextMenu.Trigger
					accessibilityLabel="Design review thread"
					haptic="medium"
					onPress={() => setOpened((count) => count + 1)}
					testID="context-menu-thread"
				>
					<View className="gap-1 rounded-lg border border-border bg-card px-4 py-3">
						<Text className="font-medium text-card-foreground">Design review</Text>
						<Text className="text-muted-foreground text-sm" numberOfLines={1}>
							Aria: I pushed the new spacing tokens, take a look
						</Text>
					</View>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item icon={IconPin} onSelect={() => setLast("Pin")}>
						Pin
					</ContextMenu.Item>
					<ContextMenu.Item icon={IconBellOff} onSelect={() => setLast("Mute")}>
						Mute
					</ContextMenu.Item>
					<ContextMenu.Separator />
					<ContextMenu.Item icon={IconTrashCan} onSelect={() => setLast("Delete")} variant="destructive">
						Delete
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu>
			<Text className="text-muted-foreground text-sm" testID="context-menu-thread-state">
				{`Opened ${opened} times · last action: ${last}`}
			</Text>
		</View>
	);
}
