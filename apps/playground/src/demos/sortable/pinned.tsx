import { Icon } from "@delacour/react-native-ui/icon";
import { IconLock } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pinned and disabled",
	caption:
		"A pinned row never moves and the others reorder around it. A disabled row cannot be lifted, but the others still move past it.",
};

const PRIORITIES: Record<string, string> = {
	inbox: "Inbox",
	urgent: "Urgent",
	today: "Today",
	week: "This week",
	later: "Later",
};

const PINNED = new Set(["inbox"]);
const DISABLED = new Set(["later"]);

export function Demo(): ReactElement {
	const [order, setOrder] = useState(["inbox", "urgent", "today", "week", "later"]);

	return (
		<Sortable gap={8} onReorder={setOrder} value={order}>
			{order.map((id) => (
				<Sortable.Item id={id} isDisabled={DISABLED.has(id)} isPinned={PINNED.has(id)} key={id}>
					<Item variant="outline">
						<Item.Content>
							<Item.Title>{PRIORITIES[id]}</Item.Title>
						</Item.Content>
						<Item.Actions>
							{PINNED.has(id) ? <Icon icon={IconLock} /> : <Sortable.Handle testID={`sortable-pinned-${id}`} />}
						</Item.Actions>
					</Item>
				</Sortable.Item>
			))}
		</Sortable>
	);
}
