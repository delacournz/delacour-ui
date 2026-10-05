import { Button } from "@delacour/react-native-ui/button";
import { IconFolder1, IconInboxEmpty, IconPencil, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Menu } from "@delacour/react-native-ui/menu";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Submenu",
	caption:
		"`Menu.Sub` expands in place under its row and pushes the rows below down — it never flies out to a second panel. The chevron turns to follow it.",
	align: "center",
};

const FOLDERS = ["Inbox", "Projects", "Receipts", "Travel"] as const;

export function Demo(): ReactElement {
	return (
		<Menu>
			<Menu.Trigger asChild>
				<Button testID="menu-sub-trigger" variant="outline">
					Message
				</Button>
			</Menu.Trigger>
			<Menu.Content>
				<Menu.Item icon={IconPencil}>Edit</Menu.Item>
				<Menu.Sub>
					<Menu.SubTrigger icon={IconFolder1} testID="menu-sub-move">
						Move to
					</Menu.SubTrigger>
					<Menu.SubContent>
						{FOLDERS.map((folder) => (
							<Menu.Item icon={folder === "Inbox" ? IconInboxEmpty : undefined} isInset key={folder}>
								{folder}
							</Menu.Item>
						))}
					</Menu.SubContent>
				</Menu.Sub>
				<Menu.Separator />
				<Menu.Item icon={IconTrashCan} variant="destructive">
					Delete
				</Menu.Item>
			</Menu.Content>
		</Menu>
	);
}
