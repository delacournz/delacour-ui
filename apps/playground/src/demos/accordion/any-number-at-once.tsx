import { Accordion } from "delacour-react-native-ui/accordion";
import { Button } from "delacour-react-native-ui/button";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Any number at once",
	caption:
		'`selectionMode="multiple"` reports a `string[]` instead of a `string | null`. This one is controlled, so the line below counts what is open.',
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
	const [open, setOpen] = useState<string[]>(["returns"]);

	return (
		<View className="gap-3">
			<Accordion onValueChange={setOpen} selectionMode="multiple" value={open}>
				{FAQ.map((entry) => (
					<Accordion.Item key={entry.key} value={entry.key}>
						<Accordion.Trigger testID={`multi-${entry.key}`}>{entry.title}</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>{entry.body}</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				))}
			</Accordion>
			<Button onPress={() => setOpen(FAQ.map((entry) => entry.key))} size="sm" variant="secondary">
				Open every one
			</Button>
			<Text.Caption>
				{open.length} of {FAQ.length} open
			</Text.Caption>
		</View>
	);
}
