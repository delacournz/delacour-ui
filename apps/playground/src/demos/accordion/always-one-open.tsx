import { Accordion } from "@delacour/native-ui/accordion";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Always one open",
	caption:
		"`isCollapsible={false}` bounds the *set*, never a single row. In multiple mode a row still closes while another is open — only the last one is refused, so the accordion can never empty and can never fill up and stick.",
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
		<Accordion defaultValue={["shipping", "returns"]} isCollapsible={false} selectionMode="multiple">
			{FAQ.map((entry) => (
				<Accordion.Item key={entry.key} value={entry.key}>
					<Accordion.Trigger testID={`bounded-${entry.key}`}>{entry.title}</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>{entry.body}</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
