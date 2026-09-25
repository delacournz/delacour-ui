import { Alert } from "@delacour/react-native-ui/alert";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`isOpen` and `onOpenChange` hand the open state to the caller. The switch and the close control drive the same value.",
};

export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(true);
	const [dismissals, setDismissals] = useState(0);

	return (
		<View className="gap-4">
			<View className="flex-row items-center justify-between">
				<Text.Label>Show maintenance notice</Text.Label>
				<Switch
					accessibilityLabel="Show maintenance notice"
					isSelected={isOpen}
					onSelectedChange={setOpen}
					testID="controlled-switch"
				/>
			</View>
			<Alert
				isDismissible
				isOpen={isOpen}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setDismissals((count) => count + 1);
				}}
				status="warning"
				testID="controlled-alert"
			>
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Scheduled maintenance</Alert.Title>
					<Alert.Description>Sign-in is unavailable Sunday 02:00–03:00.</Alert.Description>
				</Alert.Content>
			</Alert>
			<Text.Caption color="muted" testID="controlled-count">
				Dismissed {dismissals} {dismissals === 1 ? "time" : "times"}
			</Text.Caption>
		</View>
	);
}
