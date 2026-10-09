import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconArchive,
	IconDotGrid1x3Horizontal,
	IconPencil,
	IconShareOs,
	IconSquareBehindSquare1,
	IconTrashCan,
} from "@delacour/react-native-ui/icons/central";
import { Menu } from "@delacour/react-native-ui/menu";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Actions",
	caption:
		"The verbs you can apply to one thing, dropped from the ⋯ button beside it. Each row runs its action and closes the menu; the destructive one sits apart, under a separator.",
};

export function Demo(): ReactElement {
	const [last, setLast] = useState("Nothing chosen yet");

	return (
		<View className="gap-3">
			<View className="flex-row items-center justify-between rounded-lg border border-border px-4 py-3">
				<Text className="font-medium">Quarterly report.pdf</Text>
				<Menu haptic="selection">
					<Menu.Trigger asChild>
						<Button accessibilityLabel="Report actions" size="icon-sm" testID="menu-actions-trigger" variant="ghost">
							<Icon icon={IconDotGrid1x3Horizontal} />
						</Button>
					</Menu.Trigger>
					<Menu.Content align="end">
						<Menu.Item icon={IconPencil} onSelect={() => setLast("Rename")} shortcut="⌘R" testID="menu-actions-rename">
							Rename
						</Menu.Item>
						<Menu.Item icon={IconSquareBehindSquare1} onSelect={() => setLast("Duplicate")} shortcut="⌘D">
							Duplicate
						</Menu.Item>
						<Menu.Item icon={IconShareOs} onSelect={() => setLast("Share")}>
							Share
						</Menu.Item>
						<Menu.Item icon={IconArchive} isDisabled>
							Archive
						</Menu.Item>
						<Menu.Separator />
						<Menu.Item
							description="This cannot be undone"
							icon={IconTrashCan}
							onSelect={() => setLast("Delete")}
							variant="destructive"
						>
							Delete
						</Menu.Item>
					</Menu.Content>
				</Menu>
			</View>
			<Text className="text-muted-foreground text-sm" testID="menu-actions-last">
				{last}
			</Text>
		</View>
	);
}
