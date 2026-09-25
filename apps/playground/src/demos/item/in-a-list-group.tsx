import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconAirplane,
	IconBell,
	IconChevronRight,
	IconGlobe,
	IconWifiFull,
} from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a ListGroup",
	caption:
		"Items drop straight in as rows: the group draws the surface and the dividers, and each item takes the group's size.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	const [isAirplane, setIsAirplane] = useState(false);
	const [isNotifying, setIsNotifying] = useState(true);

	return (
		<ListGroup>
			<Item
				accessibilityLabel="Airplane mode"
				accessibilityRole="switch"
				accessibilityState={{ checked: isAirplane }}
				haptic="selection"
				onPress={() => setIsAirplane((value) => !value)}
				testID="item-airplane"
			>
				<Item.Media>
					<Icon icon={IconAirplane} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Airplane mode</Item.Title>
				</Item.Content>
				<Item.Actions pointerEvents="none">
					<Switch isSelected={isAirplane} />
				</Item.Actions>
			</Item>
			<Item isDisabled={isAirplane} onPress={() => {}} testID="item-wifi">
				<Item.Media>
					<Icon icon={IconWifiFull} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Wi-Fi</Item.Title>
					<Item.Description>{isAirplane ? "Off in airplane mode" : "Home network"}</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Icon icon={IconChevronRight} />
				</Item.Actions>
			</Item>
			<Item
				accessibilityLabel="Notifications"
				accessibilityRole="switch"
				accessibilityState={{ checked: isNotifying }}
				haptic="selection"
				onPress={() => setIsNotifying((value) => !value)}
				testID="item-notifications"
			>
				<Item.Media>
					<Icon icon={IconBell} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Notifications</Item.Title>
				</Item.Content>
				<Item.Actions pointerEvents="none">
					<Switch isSelected={isNotifying} />
				</Item.Actions>
			</Item>
			<Item onPress={() => {}} testID="item-language">
				<Item.Media>
					<Icon icon={IconGlobe} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Language</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Text.Caption>English</Text.Caption>
					<Icon icon={IconChevronRight} />
				</Item.Actions>
			</Item>
		</ListGroup>
	);
}
