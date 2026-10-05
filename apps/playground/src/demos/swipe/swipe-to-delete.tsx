import { IconArchive, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe } from "@delacour/react-native-ui/swipe";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swipe to delete",
	caption:
		"Slide a row toward the start to reveal its actions. Keep going past them and the outermost one, Delete, fires on release and the row leaves the list.",
	capture: { align: "stretch", flow: "swipe/swipe-to-delete" },
};

const MESSAGES = [
	{ id: "invoice", title: "Invoice #2041", description: "Payment received, thank you" },
	{ id: "standup", title: "Standup notes", description: "Three blockers, one resolved" },
	{ id: "flight", title: "Flight confirmed", description: "Wellington → Auckland, Friday" },
	{ id: "review", title: "Review requested", description: "Swipe gesture for list rows" },
] as const;

export function Demo(): ReactElement {
	const [ids, setIds] = useState<readonly string[]>(MESSAGES.map((message) => message.id));
	const remove = (id: string) => setIds((current) => current.filter((other) => other !== id));

	return (
		<Swipe.Group>
			<ListGroup>
				{MESSAGES.filter((message) => ids.includes(message.id)).map((message) => (
					<Swipe haptic="selection" key={message.id} testID={`swipe-${message.id}`}>
						<Swipe.End>
							<Swipe.Action icon={IconArchive} label="Archive" onPress={() => remove(message.id)} />
							<Swipe.Action color="destructive" icon={IconTrashCan} label="Delete" onPress={() => remove(message.id)} />
						</Swipe.End>
						<Item>
							<Item.Content>
								<Item.Title>{message.title}</Item.Title>
								<Item.Description>{message.description}</Item.Description>
							</Item.Content>
						</Item>
					</Swipe>
				))}
			</ListGroup>
		</Swipe.Group>
	);
}
