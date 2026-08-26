import { Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nothing has to opt in",
	caption:
		"Open a row and watch the block below. It slides with the panel because a real height is changing, not because it was told to — the animation lives on the accordion's own node. A layout transition would instead need painting onto every sibling on the screen to look like this.",
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
	return (
		<View className="gap-3">
			<View className="rounded-2xl bg-secondary p-4">
				<Text.Label>Above</Text.Label>
			</View>
			<Accordion variant="tertiary">
				{FAQ.map((entry) => (
					<Accordion.Item key={entry.key} value={entry.key}>
						<Accordion.Trigger testID={`push-${entry.key}`}>{entry.title}</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>{entry.body}</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				))}
			</Accordion>
			<View className="rounded-2xl bg-secondary p-4">
				<Text.Label>Below</Text.Label>
			</View>
		</View>
	);
}
