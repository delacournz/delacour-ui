import { Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, and rejected",
	caption:
		"The first switch reports every change and never accepts one. Drag it across and let go: the thumb springs back to the state the parent actually holds rather than staying where your finger left it. The second accepts them, from the same props — the only difference is what the parent does with the call.",
};

export function Demo(): ReactElement {
	const [rejected, setRejected] = useState(false);
	const [rejectedAttempts, setRejectedAttempts] = useState(0);

	return (
		<View className="gap-3">
			<View className="flex-row items-center gap-4">
				<Switch
					color="warning"
					isSelected={rejected}
					onSelectedChange={() => setRejectedAttempts((count) => count + 1)}
					testID="switch-rejecting"
				/>
				<Text.Caption>{rejectedAttempts} attempts, still off</Text.Caption>
			</View>
			<Switch color="warning" isSelected={rejected} onSelectedChange={setRejected} testID="switch-accepting" />
		</View>
	);
}
