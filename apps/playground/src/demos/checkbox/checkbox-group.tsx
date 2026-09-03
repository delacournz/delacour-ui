import { Checkbox } from "delacour-react-native-ui/checkbox";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Checkbox.Group",
	caption: "One array of the children's values. `onChecked` fires with the whole new list every time a box is toggled.",
	capture: { align: "stretch" },
};

const CHANNELS = [
	{ label: "Email", value: "email" },
	{ label: "SMS", value: "sms" },
	{ label: "Push notifications", value: "push" },
] as const;

export function Demo(): ReactElement {
	const [channels, setChannels] = useState<string[]>(["email"]);

	return (
		<View className="gap-3">
			<Checkbox.Group checked={channels} color="success" onChecked={setChannels}>
				{CHANNELS.map((channel) => (
					<Checkbox key={channel.value} testID={`checkbox-${channel.value}`} value={channel.value}>
						<Checkbox.Label>{channel.label}</Checkbox.Label>
					</Checkbox>
				))}
			</Checkbox.Group>
			<Text.Code>{JSON.stringify(channels)}</Text.Code>
			<Text.Caption>{`${channels.length} channels`}</Text.Caption>
		</View>
	);
}
