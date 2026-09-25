import { Alert } from "@delacour/react-native-ui/alert";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dismissible",
	caption:
		"Uncontrolled: `isDismissible` adds the close control and the alert hides itself when it is pressed. Reset remounts them.",
};

export function Demo(): ReactElement {
	const [round, setRound] = useState(0);

	return (
		<View className="gap-3">
			<Alert isDismissible key={`tip-${round}`} testID="dismissible-tip">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Tip</Alert.Title>
					<Alert.Description>Swipe left on a message to archive it.</Alert.Description>
				</Alert.Content>
			</Alert>
			<Alert isDismissible key={`success-${round}`} status="success" testID="dismissible-success">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Invite sent</Alert.Title>
				</Alert.Content>
			</Alert>
			<Button
				className="self-center"
				onPress={() => setRound((count) => count + 1)}
				size="sm"
				testID="dismissible-reset"
				variant="outline"
			>
				Reset
			</Button>
		</View>
	);
}
