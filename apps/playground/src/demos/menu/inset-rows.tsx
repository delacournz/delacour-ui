import { Button } from "@delacour/react-native-ui/button";
import { IconPencil, IconShareOs } from "@delacour/react-native-ui/icons/central";
import { Menu } from "@delacour/react-native-ui/menu";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inset rows",
	caption:
		"`isInset` reserves the icon column on a row with no icon, so its label lines up with the rows that have one.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Menu>
			<Menu.Trigger asChild>
				<Button variant="outline">Edit</Button>
			</Menu.Trigger>
			<Menu.Content>
				<Menu.Label isInset>Document</Menu.Label>
				<Menu.Item icon={IconPencil}>Rename</Menu.Item>
				<Menu.Item icon={IconShareOs}>Share</Menu.Item>
				<Menu.Item isInset>Version history</Menu.Item>
				<Menu.Item isInset>Download as PDF</Menu.Item>
			</Menu.Content>
		</Menu>
	);
}
