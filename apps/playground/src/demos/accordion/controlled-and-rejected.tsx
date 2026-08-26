import { Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, and rejected",
	caption:
		"This one reports every tap and accepts none. The panel never opens and the chevron never turns, because both read the state the parent actually holds rather than the tap that asked for it.",
};

const FAQ = [
	{
		key: "shipping",
		title: "Shipping",
		body: "Tracked from the moment it leaves us, and signed for on anything over $200. Rural addresses add a day.",
	},
	{
		key: "returns",
		title: "Returns",
		body: "Send it back in any condition within thirty days. We pay the return postage and refund to the original card.",
	},
	{
		key: "warranty",
		title: "Warranty",
		body: "Covers manufacturing faults for two years from delivery. Wear, water and the dog are not manufacturing faults.",
	},
] as const;

export function Demo(): ReactElement {
	const [rejectedAttempts, setRejectedAttempts] = useState(0);

	return (
		<View className="gap-3">
			<Accordion onValueChange={() => setRejectedAttempts((count) => count + 1)} value={null}>
				{FAQ.map((entry) => (
					<Accordion.Item key={entry.key} value={entry.key}>
						<Accordion.Trigger testID={`rejecting-${entry.key}`}>{entry.title}</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>{entry.body}</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				))}
			</Accordion>
			<Text.Caption>{rejectedAttempts} attempts, still shut</Text.Caption>
		</View>
	);
}
