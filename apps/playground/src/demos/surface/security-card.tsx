import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconKey1, IconShield } from "@delacour/react-native-ui/icons/central";
import { Surface } from "@delacour/react-native-ui/surface";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Security card",
	caption:
		"A settings card as an app would write it. The inner panels name no variant — they step from the card — and the switch is controlled, so the status line follows it.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isTwoFactor, setTwoFactor] = useState(false);
	const [keys, setKeys] = useState(1);

	return (
		<Surface className="gap-4" padding="lg">
			<View className="flex-row items-center gap-3">
				<Icon icon={IconShield} size="lg" />
				<View className="flex-1">
					<Text.Header>Security</Text.Header>
					<Text.Caption>Signed in as sam@example.com</Text.Caption>
				</View>
			</View>
			<Surface className="flex-row items-center gap-3" padding="sm">
				<View className="flex-1 gap-0.5">
					<Text.Label>Two-factor authentication</Text.Label>
					<Text.Caption testID="security-status">{isTwoFactor ? "On — codes from your app" : "Off"}</Text.Caption>
				</View>
				<Switch
					accessibilityLabel="Two-factor authentication"
					isSelected={isTwoFactor}
					onSelectedChange={setTwoFactor}
					testID="security-two-factor"
				/>
			</Surface>
			<Surface className="flex-row items-center gap-3" padding="sm">
				<Icon icon={IconKey1} />
				<Text.Label className="flex-1" testID="security-keys">
					{keys === 1 ? "1 passkey" : `${keys} passkeys`}
				</Text.Label>
				<Button onPress={() => setKeys((count) => count + 1)} size="sm" testID="security-add-key" variant="outline">
					Add
				</Button>
			</Surface>
		</Surface>
	);
}
