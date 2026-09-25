import { Chip } from "@delacour/react-native-ui/chip";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled and uncontrolled",
	caption:
		"`defaultSelected` lets the chip hold its own state and report changes. `isSelected` hands it to the screen — here a switch and the chip drive one value from either end.",
};

export function Demo(): ReactElement {
	const [changes, setChanges] = useState(0);
	const [isOn, setOn] = useState(true);

	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text.Caption color="muted">Uncontrolled</Text.Caption>
				<View className="flex-row items-center gap-3">
					<Chip
						color="info"
						defaultSelected
						onSelectedChange={() => setChanges((count) => count + 1)}
						testID="uncontrolled-chip"
					>
						Notifications
					</Chip>
					<Text.Caption color="muted" testID="uncontrolled-count">
						{changes === 1 ? "1 change" : `${changes} changes`}
					</Text.Caption>
				</View>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">Controlled</Text.Caption>
				<View className="flex-row items-center gap-3">
					<Chip color="success" isSelected={isOn} onSelectedChange={setOn} testID="controlled-chip">
						Sync
					</Chip>
					<Switch accessibilityLabel="Sync" isSelected={isOn} onSelectedChange={setOn} testID="controlled-switch" />
				</View>
			</View>
		</View>
	);
}
