import { Icon } from "@delacour/native-ui/icon";
import { IconBell } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a settings list",
	caption:
		"The row is a `ListGroup.Item` with the switch in its suffix, and the row's own press toggles the same setting — a row that animates under your finger has to do something, or the feedback is promising an action it does not have. Tapping the pill toggles once, not twice: the switch's pan claims the touch from the row.",
	capture: { align: "stretch" },
};

const SETTINGS = [
	{ key: "wifi", title: "Wi-Fi", description: "Join known networks automatically" },
	{ key: "bluetooth", title: "Bluetooth", description: "Discoverable while this screen is open" },
	{ key: "airdrop", title: "AirDrop", description: "Receive from everyone for ten minutes" },
] as const;

export function Demo(): ReactElement {
	const [settings, setSettings] = useState<Record<string, boolean>>({ wifi: true });

	const enabled = Object.values(settings).filter(Boolean).length;

	const toggleSetting = (key: string) => setSettings((current) => ({ ...current, [key]: !current[key] }));

	return (
		<View className="gap-3">
			<ListGroup>
				{SETTINGS.map((setting) => (
					<ListGroup.Item key={setting.key} onPress={() => toggleSetting(setting.key)} testID={`row-${setting.key}`}>
						<ListGroup.ItemPrefix>
							<Icon icon={IconBell} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{setting.title}</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>{setting.description}</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Switch
								accessibilityLabel={setting.title}
								color="success"
								isSelected={settings[setting.key] ?? false}
								onSelectedChange={() => toggleSetting(setting.key)}
								size="sm"
								testID={`switch-${setting.key}`}
							/>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
			<Text.Caption>{`${enabled} of ${SETTINGS.length} settings on`}</Text.Caption>
		</View>
	);
}
