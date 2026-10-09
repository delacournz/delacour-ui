import { ContextMenu } from "@delacour/react-native-ui/context-menu";
import {
	IconArrowShareLeft,
	IconBookmark,
	IconShareOs,
	IconSquareBehindSquare1,
	IconTrashCan,
} from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Message actions",
	caption:
		"Hold a message for what you can do with it. The panel opens at your finger, over a dimmed screen; each row runs its action and closes.",
	capture: { frame: "device", flow: "context-menu/message-actions", hero: true },
};

export function Demo(): ReactElement {
	const [last, setLast] = useState("Hold the message");

	return (
		<View className="flex-1 justify-center gap-3 px-screen-gutter">
			<ContextMenu>
				<ContextMenu.Trigger accessibilityLabel="Message from Aria" haptic="medium" testID="context-menu-message">
					<View className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
						<Text className="text-secondary-foreground">Are we still on for Thursday? I can bring the slides.</Text>
					</View>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item icon={IconArrowShareLeft} onSelect={() => setLast("Reply")} testID="context-menu-reply">
						Reply
					</ContextMenu.Item>
					<ContextMenu.Item icon={IconSquareBehindSquare1} onSelect={() => setLast("Copy")}>
						Copy
					</ContextMenu.Item>
					<ContextMenu.Item icon={IconBookmark} onSelect={() => setLast("Save")}>
						Save
					</ContextMenu.Item>
					<ContextMenu.Item icon={IconShareOs} onSelect={() => setLast("Share")}>
						Share
					</ContextMenu.Item>
					<ContextMenu.Separator />
					<ContextMenu.Item icon={IconTrashCan} onSelect={() => setLast("Delete")} variant="destructive">
						Delete
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu>
			<Text className="text-muted-foreground text-sm" testID="context-menu-message-last">
				{last}
			</Text>
		</View>
	);
}
