import { Button } from "@delacour/react-native-ui/button";
import { IconPencil, IconShareOs, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Menu } from "@delacour/react-native-ui/menu";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Near the bottom edge",
	caption:
		"With no room below the trigger the panel flips above it, and it stays inside the safe area at the sides. `placement` names the side it prefers; the room decides.",
};

export function Demo(): ReactElement {
	return (
		<View className="min-h-[560px] justify-end">
			<View className="items-start">
				<Menu>
					<Menu.Trigger asChild>
						<Button testID="menu-bottom-trigger" variant="outline">
							More
						</Button>
					</Menu.Trigger>
					<Menu.Content>
						<Menu.Item icon={IconPencil}>Rename</Menu.Item>
						<Menu.Item icon={IconShareOs}>Share</Menu.Item>
						<Menu.Separator />
						<Menu.Item icon={IconTrashCan} variant="destructive">
							Delete
						</Menu.Item>
					</Menu.Content>
				</Menu>
			</View>
		</View>
	);
}
