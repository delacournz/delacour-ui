import { Accordion } from "@delacour/native-ui/accordion";
import { Icon } from "@delacour/native-ui/icon";
import { IconMinusSmall, IconPlusSmall } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A custom indicator",
	caption:
		"Anything composed into an indicator rotates off the item's own travel, exactly like the default chevron. `isAnimated={false}` opts a *swapping* glyph out — a plus becoming a minus reads as broken when it also spins. The children can be a function, handed the row's state, so a swapping glyph needs no component of its own.",
	capture: { align: "stretch" },
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
		<Accordion>
			{FAQ.map((entry) => (
				<Accordion.Item key={entry.key} value={entry.key}>
					<Accordion.Trigger testID={`swap-${entry.key}`}>
						<Accordion.Title>{entry.title}</Accordion.Title>
						<Accordion.Indicator isAnimated={false}>
							{({ isExpanded }) => <Icon icon={isExpanded ? IconMinusSmall : IconPlusSmall} />}
						</Accordion.Indicator>
					</Accordion.Trigger>
					<Accordion.Content>
						<Text.Paragraph>{entry.body}</Text.Paragraph>
					</Accordion.Content>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
