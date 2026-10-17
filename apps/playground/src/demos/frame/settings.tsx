import { Frame } from "@delacour/react-native-ui/frame";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconEmail1, IconMoon } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Switch } from "@delacour/react-native-ui/switch";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Settings",
	caption:
		"A title and a link above a card of rows — the settings-screen shape. The rows are plain `Item`s; the tray groups them.",
	capture: { align: "stretch", flow: "frame/settings", hero: true },
};

export function Demo(): ReactElement {
	const [isPush, setIsPush] = useState(true);
	const [isEmail, setIsEmail] = useState(false);
	const [isQuiet, setIsQuiet] = useState(true);
	const [opened, setOpened] = useState(0);

	return (
		<Frame testID="frame-settings">
			<Frame.Header>
				<Frame.Title testID="frame-title">Notifications</Frame.Title>
				<Frame.Action onPress={() => setOpened((count) => count + 1)} testID="frame-action">
					{opened === 0 ? "Manage" : "Opened"}
				</Frame.Action>
			</Frame.Header>
			<Frame.Tray>
				<Item>
					<Item.Media>
						<Icon icon={IconBell} />
					</Item.Media>
					<Item.Content>
						<Item.Title>Push</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Switch accessibilityLabel="Push" isSelected={isPush} onSelectedChange={setIsPush} testID="switch-push" />
					</Item.Actions>
				</Item>
				<Item>
					<Item.Media>
						<Icon icon={IconEmail1} />
					</Item.Media>
					<Item.Content>
						<Item.Title>Email</Item.Title>
						<Item.Description>A summary once a day</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Switch
							accessibilityLabel="Email"
							isSelected={isEmail}
							onSelectedChange={setIsEmail}
							testID="switch-email"
						/>
					</Item.Actions>
				</Item>
				<Item>
					<Item.Media>
						<Icon icon={IconMoon} />
					</Item.Media>
					<Item.Content>
						<Item.Title>Quiet hours</Item.Title>
						<Item.Description>22:00 – 07:00</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Switch
							accessibilityLabel="Quiet hours"
							isSelected={isQuiet}
							onSelectedChange={setIsQuiet}
							testID="switch-quiet"
						/>
					</Item.Actions>
				</Item>
			</Frame.Tray>
		</Frame>
	);
}
