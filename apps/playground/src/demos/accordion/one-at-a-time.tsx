import { Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "One at a time",
	caption:
		"The default. Opening a row closes the one that was open, and tapping the open one closes it — a panel's height is measured, then sprung from zero to whatever its content came out at.",
	capture: { align: "stretch", hero: true },
};

const FAQ = [
	{
		key: "shipping",
		title: "Shipping",
		description: "2–5 business days",
		body: "Tracked from the moment it leaves us, and signed for on anything over $200. Rural addresses add a day.",
	},
	{
		key: "returns",
		title: "Returns",
		description: "30 days, no questions",
		body: "Send it back in any condition within thirty days. We pay the return postage and refund to the original card.",
	},
	{
		key: "warranty",
		title: "Warranty",
		description: "Two years",
		body: "Covers manufacturing faults for two years from delivery. Wear, water and the dog are not manufacturing faults.",
	},
] as const;

export function Demo(): ReactElement {
	return (
		<Accordion defaultValue="shipping">
			{FAQ.map((entry) => (
				<Accordion.Item key={entry.key} value={entry.key}>
					<Accordion.Trigger testID={`faq-${entry.key}`}>
						<Accordion.Title>{entry.title}</Accordion.Title>
						<Accordion.Description>{entry.description}</Accordion.Description>
					</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>{entry.body}</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
