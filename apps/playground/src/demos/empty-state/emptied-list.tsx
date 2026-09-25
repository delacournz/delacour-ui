import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBag, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Emptied list",
	caption: "Remove every item and the list gives way to an empty state whose action puts them back.",
	capture: { align: "stretch" },
};

const ITEMS = ["Linen shirt", "Canvas tote", "Wool socks"] as const;

export function Demo(): ReactElement {
	const [items, setItems] = useState<readonly string[]>(ITEMS);

	if (items.length === 0) {
		return (
			<EmptyState testID="cart-empty" variant="card">
				<EmptyState.Header>
					<EmptyState.Media variant="icon">
						<Icon icon={IconBag} />
					</EmptyState.Media>
					<EmptyState.Title>Your bag is empty</EmptyState.Title>
					<EmptyState.Description>Items you add will wait here until checkout.</EmptyState.Description>
				</EmptyState.Header>
				<EmptyState.Content>
					<Button onPress={() => setItems(ITEMS)} testID="restore">
						Restore items
					</Button>
				</EmptyState.Content>
			</EmptyState>
		);
	}

	return (
		<ListGroup>
			{items.map((item, index) => (
				<ListGroup.Item key={item}>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>{item}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<Button
							accessibilityLabel={`Remove ${item}`}
							onPress={() => setItems((current) => current.filter((name) => name !== item))}
							size="icon-sm"
							testID={`remove-${index}`}
							variant="ghost"
						>
							<Icon icon={IconTrashCan} />
						</Button>
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			))}
		</ListGroup>
	);
}
