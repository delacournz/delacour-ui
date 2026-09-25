import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckmark1, IconEmail1, IconStar, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inbox",
	caption: "A composed list: mark a message read, star it, or delete it and undo.",
	capture: { align: "stretch" },
};

type Message = { id: string; from: string; subject: string; isRead: boolean; isStarred: boolean };

const MESSAGES: readonly Message[] = [
	{ id: "m1", from: "Aroha Rangi", subject: "Launch checklist, final pass", isRead: false, isStarred: true },
	{ id: "m2", from: "Billing", subject: "Your September invoice is ready", isRead: false, isStarred: false },
	{ id: "m3", from: "Tomas Webb", subject: "Re: row padding in the settings list", isRead: true, isStarred: false },
];

export function Demo(): ReactElement {
	const [messages, setMessages] = useState<readonly Message[]>(MESSAGES);
	const [deleted, setDeleted] = useState<Message | null>(null);

	const update = (id: string, change: Partial<Message>) =>
		setMessages((list) => list.map((message) => (message.id === id ? { ...message, ...change } : message)));

	const remove = (message: Message) => {
		setMessages((list) => list.filter((entry) => entry.id !== message.id));
		setDeleted(message);
	};

	const undo = () => {
		if (!deleted) return;
		setMessages((list) =>
			MESSAGES.map((original) =>
				original.id === deleted.id ? deleted : list.find((m) => m.id === original.id)
			).filter((message): message is Message => message !== undefined)
		);
		setDeleted(null);
	};

	return (
		<View className="gap-3">
			<ListGroup>
				{messages.map((message) => (
					<Item key={message.id} testID={`item-${message.id}`}>
						<Item.Media variant="icon">
							<Icon color={message.isRead ? "muted-foreground" : "primary"} icon={IconEmail1} />
						</Item.Media>
						<Item.Content>
							<Item.Title className={message.isRead ? "font-normal" : "font-semibold"} numberOfLines={1}>
								{message.from}
							</Item.Title>
							<Item.Description numberOfLines={1}>{message.subject}</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Button
								accessibilityLabel={message.isRead ? "Mark unread" : "Mark read"}
								onPress={() => update(message.id, { isRead: !message.isRead })}
								size="icon-sm"
								testID={`read-${message.id}`}
								variant="ghost"
							>
								<Icon icon={message.isRead ? IconEmail1 : IconCheckmark1} />
							</Button>
							<Button
								accessibilityLabel={message.isStarred ? "Unstar" : "Star"}
								onPress={() => update(message.id, { isStarred: !message.isStarred })}
								size="icon-sm"
								testID={`star-${message.id}`}
								variant="ghost"
							>
								<Icon color={message.isStarred ? "warning" : undefined} icon={IconStar} />
							</Button>
							<Button
								accessibilityLabel="Delete"
								onPress={() => remove(message)}
								size="icon-sm"
								testID={`delete-${message.id}`}
								variant="ghost"
							>
								<Icon icon={IconTrashCan} />
							</Button>
						</Item.Actions>
					</Item>
				))}
			</ListGroup>
			{deleted ? (
				<Item variant="muted">
					<Item.Content>
						<Item.Title>Message deleted</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Button onPress={undo} size="sm" testID="button-undo" variant="outline">
							<Button.Label>Undo</Button.Label>
						</Button>
					</Item.Actions>
				</Item>
			) : null}
			{messages.length === 0 && !deleted ? <Text.Caption className="text-center">Inbox zero</Text.Caption> : null}
		</View>
	);
}
