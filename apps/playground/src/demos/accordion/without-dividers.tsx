import { Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Without dividers",
	caption:
		"Dividers are inserted between adjacent rows rather than written out, inset to the triggers' own padding. A `Separator` placed by hand suppresses the automatic one on either side; `isDivided={false}` turns them off.",
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
		<Accordion isDivided={false} variant="secondary">
			{FAQ.map((entry) => (
				<Accordion.Item key={entry.key} value={entry.key}>
					<Accordion.Trigger testID={`undivided-${entry.key}`}>{entry.title}</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>{entry.body}</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
