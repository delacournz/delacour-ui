import { Button } from "@delacour/react-native-ui/button";
import { IconBell, IconStar } from "@delacour/react-native-ui/icons/central";
import { Menu } from "@delacour/react-native-ui/menu";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom background",
	caption:
		"Pass a `Menu.Background` as a child of `Menu.Content` to repaint the panel. It is drawn behind the scroller, so it stays put while the rows scroll.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<Menu>
			<Menu.Trigger asChild>
				<Button variant="outline">Follow</Button>
			</Menu.Trigger>
			<Menu.Content>
				<Menu.Background className="bg-muted" />
				<Menu.Item icon={IconStar}>Add to favourites</Menu.Item>
				<Menu.Item icon={IconBell}>Turn on notifications</Menu.Item>
			</Menu.Content>
		</Menu>
	);
}
