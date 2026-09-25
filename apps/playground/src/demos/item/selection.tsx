import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckmark1 } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Selection",
	caption: "`isSelected` lays the accent over the row and announces it as selected; the check is composed in.",
	capture: { align: "stretch" },
};

const PLANS = [
	{ id: "monthly", title: "Monthly", description: "$12 a month, cancel any time" },
	{ id: "yearly", title: "Yearly", description: "$120 a year — two months free" },
	{ id: "lifetime", title: "Lifetime", description: "$300 once" },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export function Demo(): ReactElement {
	const [plan, setPlan] = useState<PlanId>("yearly");

	return (
		<ListGroup>
			{PLANS.map((entry) => (
				<Item
					haptic="selection"
					isSelected={plan === entry.id}
					key={entry.id}
					onPress={() => setPlan(entry.id)}
					testID={`item-${entry.id}`}
				>
					<Item.Content>
						<Item.Title>{entry.title}</Item.Title>
						<Item.Description>{entry.description}</Item.Description>
					</Item.Content>
					{plan === entry.id ? (
						<Item.Actions>
							<Icon color="primary" icon={IconCheckmark1} />
						</Item.Actions>
					) : null}
				</Item>
			))}
		</ListGroup>
	);
}
